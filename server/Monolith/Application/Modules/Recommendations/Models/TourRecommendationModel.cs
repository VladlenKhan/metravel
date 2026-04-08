namespace Application.Modules.Recommendations.Models;

public class TourRecommendationModel
{
    public string ModelType { get; set; } = "ContentBasedTourRecommendation";

    public DateTime TrainedAtUtc { get; set; }

    public int TourCount { get; set; }

    public int TrainingSampleCount { get; set; }

    public int EvaluationSampleCount { get; set; }

    public double Accuracy { get; set; }

    public double Top3Accuracy { get; set; }

    public RecommendationNormalizationSettings Normalization { get; set; } = new();

    public List<TourRecommendationProfile> Profiles { get; set; } = new();
}

public class RecommendationNormalizationSettings
{
    public decimal MinPrice { get; set; }

    public decimal MaxPrice { get; set; }

    public int MinDurationDays { get; set; }

    public int MaxDurationDays { get; set; }
}

public class TourRecommendationProfile
{
    public Guid TourId { get; set; }

    public string Title { get; set; } = null!;

    public string Country { get; set; } = null!;

    public string City { get; set; } = null!;

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public int DurationDays { get; set; }

    public int StartMonth { get; set; }

    public decimal BasePrice { get; set; }

    public int AvailableSeats { get; set; }
}
