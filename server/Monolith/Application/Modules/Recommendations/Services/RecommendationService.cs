using Application.Modules.Audit.Interfaces;
using Application.Modules.Recommendations.DTOs;
using Application.Modules.Recommendations.Interfaces;
using Application.Modules.Recommendations.Models;
using Application.Modules.Tours.Interfaces;
using Domain.Tours;
using Microsoft.Extensions.Logging;

namespace Application.Modules.Recommendations.Services;

public class RecommendationService : IRecommendationService
{
    private const int SyntheticSamplesPerTour = 8;
    private readonly ITourRepository _tourRepository;
    private readonly IRecommendationModelStore _modelStore;
    private readonly IAuditService _auditService;
    private readonly ILogger<RecommendationService> _logger;

    public RecommendationService(
        ITourRepository tourRepository,
        IRecommendationModelStore modelStore,
        IAuditService auditService,
        ILogger<RecommendationService> logger)
    {
        _tourRepository = tourRepository;
        _modelStore = modelStore;
        _auditService = auditService;
        _logger = logger;
    }

    public async Task<RecommendationTrainingResultDto> TrainAsync(CancellationToken cancellationToken = default)
    {
        var tours = await GetTrainableToursAsync(cancellationToken);
        if (tours.Count == 0)
        {
            throw new InvalidOperationException("Недостаточно данных для обучения модели рекомендаций.");
        }

        var model = BuildModel(tours);
        await _modelStore.SaveAsync(model, cancellationToken);

        _logger.LogInformation(
            "Модель рекомендаций обучена. Tours={TourCount}, Accuracy={Accuracy}, Top3={Top3Accuracy}",
            model.TourCount,
            model.Accuracy,
            model.Top3Accuracy);

        await _auditService.WriteAsync(
            action: "Train",
            entityType: "RecommendationModel",
            entityId: "TourRecommendationModel",
            success: true,
            details: $"Модель рекомендаций обучена. Accuracy={model.Accuracy:F2}, Top3={model.Top3Accuracy:F2}",
            cancellationToken: cancellationToken);

        return MapTrainingResult(model, _modelStore.ModelPath);
    }

    public async Task<RecommendationTrainingResultDto?> GetModelInfoAsync(CancellationToken cancellationToken = default)
    {
        var model = _modelStore.Current ?? await _modelStore.LoadAsync(cancellationToken);
        if (model is null)
        {
            return null;
        }

        return MapTrainingResult(model, _modelStore.ModelPath);
    }

    public async Task<IReadOnlyList<TourRecommendationDto>> RecommendAsync(
        TourRecommendationRequestDto request,
        CancellationToken cancellationToken = default)
    {
        ValidateRequest(request);

        var model = await EnsureModelAsync(cancellationToken);
        var top = Math.Clamp(request.Top, 1, 10);

        var recommendations = ScoreProfiles(request, model)
            .Take(top)
            .Select(score => new TourRecommendationDto
            {
                TourId = score.Profile.TourId,
                Title = score.Profile.Title,
                Country = score.Profile.Country,
                City = score.Profile.City,
                StartDate = score.Profile.StartDate,
                EndDate = score.Profile.EndDate,
                DurationDays = score.Profile.DurationDays,
                BasePrice = score.Profile.BasePrice,
                Score = Math.Round(score.Score, 4),
                Explanation = BuildExplanation(request, score.Profile)
            })
            .ToList();

        _logger.LogInformation(
            "Сформированы рекомендации туров. Count={Count}, Country={Country}, City={City}",
            recommendations.Count,
            request.Country,
            request.City);

        return recommendations;
    }

    private async Task<TourRecommendationModel> EnsureModelAsync(CancellationToken cancellationToken)
    {
        var model = _modelStore.Current ?? await _modelStore.LoadAsync(cancellationToken);
        if (model is not null)
        {
            return model;
        }

        var result = await TrainAsync(cancellationToken);
        return _modelStore.Current
            ?? throw new InvalidOperationException($"Модель не загружена после обучения: {result.ModelPath}");
    }

    private async Task<IReadOnlyList<Tour>> GetTrainableToursAsync(CancellationToken cancellationToken)
    {
        var tours = await _tourRepository.GetAllAsync(cancellationToken);
        return tours
            .Where(t => t.AvailableSeats > 0)
            .Where(t => GetDurationDays(t) > 0)
            .ToList();
    }

    private static TourRecommendationModel BuildModel(IReadOnlyList<Tour> tours)
    {
        var normalization = BuildNormalization(tours);
        var profiles = tours
            .Select(MapProfile)
            .OrderBy(profile => profile.Country)
            .ThenBy(profile => profile.City)
            .ThenBy(profile => profile.BasePrice)
            .ToList();

        var samples = Shuffle(GenerateSyntheticSamples(tours).ToList(), new Random(20260407));
        var evaluationCount = Math.Max(1, samples.Count / 5);
        var evaluationSet = samples.Take(evaluationCount).ToList();

        var correctTop1 = 0;
        var correctTop3 = 0;

        foreach (var sample in evaluationSet)
        {
            var rankedProfiles = ScoreProfiles(sample.Request, profiles, normalization).Take(3).ToList();
            if (rankedProfiles.Count == 0)
            {
                continue;
            }

            if (rankedProfiles[0].Profile.TourId == sample.ExpectedTourId)
            {
                correctTop1++;
            }

            if (rankedProfiles.Any(item => item.Profile.TourId == sample.ExpectedTourId))
            {
                correctTop3++;
            }
        }

        return new TourRecommendationModel
        {
            TrainedAtUtc = DateTime.UtcNow,
            TourCount = profiles.Count,
            TrainingSampleCount = samples.Count,
            EvaluationSampleCount = evaluationSet.Count,
            Accuracy = evaluationSet.Count == 0 ? 0 : (double)correctTop1 / evaluationSet.Count,
            Top3Accuracy = evaluationSet.Count == 0 ? 0 : (double)correctTop3 / evaluationSet.Count,
            Normalization = normalization,
            Profiles = profiles
        };
    }

    private static RecommendationNormalizationSettings BuildNormalization(IReadOnlyList<Tour> tours)
    {
        return new RecommendationNormalizationSettings
        {
            MinPrice = tours.Min(tour => tour.BasePrice),
            MaxPrice = tours.Max(tour => tour.BasePrice),
            MinDurationDays = tours.Min(GetDurationDays),
            MaxDurationDays = tours.Max(GetDurationDays)
        };
    }

    private static IEnumerable<SyntheticSample> GenerateSyntheticSamples(IReadOnlyList<Tour> tours)
    {
        var random = new Random(20260407);

        foreach (var tour in tours)
        {
            var duration = GetDurationDays(tour);
            for (var i = 0; i < SyntheticSamplesPerTour; i++)
            {
                var budgetFactor = 0.85m + ((decimal)random.NextDouble() * 0.30m);
                var durationOffset = random.Next(-1, 2);
                var monthOffset = random.Next(-1, 2);

                yield return new SyntheticSample(
                    tour.Id,
                    new TourRecommendationRequestDto
                    {
                        Country = tour.Country,
                        City = random.NextDouble() < 0.75 ? tour.City : null,
                        Budget = Math.Round(tour.BasePrice * budgetFactor, 2),
                        DesiredDurationDays = Math.Max(1, duration + durationOffset),
                        PreferredMonth = NormalizeMonth(tour.StartDate.Month + monthOffset),
                        Top = 3
                    });
            }
        }
    }

    private static List<RankedProfile> ScoreProfiles(TourRecommendationRequestDto request, TourRecommendationModel model)
    {
        return ScoreProfiles(request, model.Profiles, model.Normalization);
    }

    private static List<RankedProfile> ScoreProfiles(
        TourRecommendationRequestDto request,
        IReadOnlyList<TourRecommendationProfile> profiles,
        RecommendationNormalizationSettings normalization)
    {
        return profiles
            .Select(profile => new RankedProfile(profile, CalculateScore(request, profile, normalization)))
            .OrderByDescending(item => item.Score)
            .ThenBy(item => item.Profile.BasePrice)
            .ToList();
    }

    private static double CalculateScore(
        TourRecommendationRequestDto request,
        TourRecommendationProfile profile,
        RecommendationNormalizationSettings normalization)
    {
        double weightedScore = 0;
        double totalWeight = 0;

        if (!string.IsNullOrWhiteSpace(request.Country))
        {
            const double weight = 3.0;
            totalWeight += weight;
            if (string.Equals(request.Country.Trim(), profile.Country, StringComparison.OrdinalIgnoreCase))
            {
                weightedScore += weight;
            }
        }

        if (!string.IsNullOrWhiteSpace(request.City))
        {
            const double weight = 3.0;
            totalWeight += weight;
            if (string.Equals(request.City.Trim(), profile.City, StringComparison.OrdinalIgnoreCase))
            {
                weightedScore += weight;
            }
        }

        if (request.Budget.HasValue)
        {
            const double weight = 2.0;
            totalWeight += weight;
            weightedScore += GetNormalizedSimilarity(
                request.Budget.Value,
                profile.BasePrice,
                normalization.MinPrice,
                normalization.MaxPrice) * weight;
        }

        if (request.DesiredDurationDays.HasValue)
        {
            const double weight = 1.5;
            totalWeight += weight;
            weightedScore += GetNormalizedSimilarity(
                request.DesiredDurationDays.Value,
                profile.DurationDays,
                normalization.MinDurationDays,
                normalization.MaxDurationDays) * weight;
        }

        if (request.PreferredMonth.HasValue)
        {
            const double weight = 1.0;
            totalWeight += weight;
            weightedScore += GetMonthSimilarity(request.PreferredMonth.Value, profile.StartMonth) * weight;
        }

        if (totalWeight == 0)
        {
            return 0;
        }

        return weightedScore / totalWeight;
    }

    private static double GetNormalizedSimilarity(decimal requested, decimal actual, decimal min, decimal max)
    {
        if (max <= min)
        {
            return requested == actual ? 1 : 0;
        }

        var distance = Math.Abs(requested - actual);
        var range = max - min;
        var normalizedDistance = (double)(distance / range);
        return Math.Max(0, 1 - normalizedDistance);
    }

    private static double GetNormalizedSimilarity(int requested, int actual, int min, int max)
    {
        if (max <= min)
        {
            return requested == actual ? 1 : 0;
        }

        var distance = Math.Abs(requested - actual);
        var range = max - min;
        var normalizedDistance = (double)distance / range;
        return Math.Max(0, 1 - normalizedDistance);
    }

    private static double GetMonthSimilarity(int requestedMonth, int actualMonth)
    {
        var directDistance = Math.Abs(requestedMonth - actualMonth);
        var cyclicDistance = Math.Min(directDistance, 12 - directDistance);
        return Math.Max(0, 1 - (cyclicDistance / 6.0));
    }

    private static string BuildExplanation(TourRecommendationRequestDto request, TourRecommendationProfile profile)
    {
        var reasons = new List<string>();

        if (!string.IsNullOrWhiteSpace(request.Country) &&
            string.Equals(request.Country.Trim(), profile.Country, StringComparison.OrdinalIgnoreCase))
        {
            reasons.Add("совпадает страна");
        }

        if (!string.IsNullOrWhiteSpace(request.City) &&
            string.Equals(request.City.Trim(), profile.City, StringComparison.OrdinalIgnoreCase))
        {
            reasons.Add("совпадает город");
        }

        if (request.Budget.HasValue && profile.BasePrice <= request.Budget.Value * 1.1m)
        {
            reasons.Add("подходит по бюджету");
        }

        if (request.DesiredDurationDays.HasValue &&
            Math.Abs(profile.DurationDays - request.DesiredDurationDays.Value) <= 1)
        {
            reasons.Add("подходит по длительности");
        }

        if (request.PreferredMonth.HasValue && profile.StartMonth == request.PreferredMonth.Value)
        {
            reasons.Add("подходит по месяцу поездки");
        }

        return reasons.Count == 0
            ? "подобран по общей близости параметров"
            : string.Join(", ", reasons);
    }

    private static TourRecommendationProfile MapProfile(Tour tour)
    {
        return new TourRecommendationProfile
        {
            TourId = tour.Id,
            Title = tour.Title,
            Country = tour.Country,
            City = tour.City,
            StartDate = tour.StartDate,
            EndDate = tour.EndDate,
            DurationDays = GetDurationDays(tour),
            StartMonth = tour.StartDate.Month,
            BasePrice = tour.BasePrice,
            AvailableSeats = tour.AvailableSeats
        };
    }

    private static int GetDurationDays(Tour tour)
    {
        var days = tour.EndDate.DayNumber - tour.StartDate.DayNumber + 1;
        return Math.Max(1, days);
    }

    private static RecommendationTrainingResultDto MapTrainingResult(TourRecommendationModel model, string modelPath)
    {
        return new RecommendationTrainingResultDto
        {
            ModelType = model.ModelType,
            TrainedAtUtc = model.TrainedAtUtc,
            TourCount = model.TourCount,
            TrainingSampleCount = model.TrainingSampleCount,
            EvaluationSampleCount = model.EvaluationSampleCount,
            Accuracy = Math.Round(model.Accuracy, 4),
            Top3Accuracy = Math.Round(model.Top3Accuracy, 4),
            ModelPath = modelPath
        };
    }

    private static void ValidateRequest(TourRecommendationRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Country) &&
            string.IsNullOrWhiteSpace(request.City) &&
            request.Budget is null &&
            request.DesiredDurationDays is null &&
            request.PreferredMonth is null)
        {
            throw new ArgumentException("Нужно указать хотя бы один параметр для рекомендации.");
        }

        if (request.PreferredMonth is < 1 or > 12)
        {
            throw new ArgumentException("Месяц поездки должен быть в диапазоне от 1 до 12.");
        }

        if (request.DesiredDurationDays <= 0)
        {
            throw new ArgumentException("Длительность поездки должна быть больше нуля.");
        }

        if (request.Budget <= 0)
        {
            throw new ArgumentException("Бюджет должен быть больше нуля.");
        }

        if (request.Top <= 0)
        {
            throw new ArgumentException("Количество рекомендаций должно быть больше нуля.");
        }
    }

    private static int NormalizeMonth(int month)
    {
        if (month < 1)
        {
            return 12;
        }

        if (month > 12)
        {
            return 1;
        }

        return month;
    }

    private static List<T> Shuffle<T>(IReadOnlyList<T> items, Random random)
    {
        var copy = items.ToList();
        for (var i = copy.Count - 1; i > 0; i--)
        {
            var j = random.Next(i + 1);
            (copy[i], copy[j]) = (copy[j], copy[i]);
        }

        return copy;
    }

    private sealed record SyntheticSample(Guid ExpectedTourId, TourRecommendationRequestDto Request);

    private sealed record RankedProfile(TourRecommendationProfile Profile, double Score);
}
