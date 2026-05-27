using Application.Modules.Recommendations.DTOs;

namespace Application.Modules.Recommendations.Interfaces;

public interface IRecommendationService
{
    Task<RecommendationTrainingResultDto> TrainAsync(CancellationToken cancellationToken = default);

    Task<RecommendationTrainingResultDto?> GetModelInfoAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<TourRecommendationDto>> RecommendAsync(
        TourRecommendationRequestDto request,
        CancellationToken cancellationToken = default);
}
