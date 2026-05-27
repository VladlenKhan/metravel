namespace Application.Modules.Recommendations.DTOs;

public class RecommendationTrainingResultDto
{
    public string ModelType { get; set; } = null!;

    public DateTime TrainedAtUtc { get; set; }

    public int TourCount { get; set; }

    public int TrainingSampleCount { get; set; }

    public int EvaluationSampleCount { get; set; }

    public double Accuracy { get; set; }

    public double Top3Accuracy { get; set; }

    public string ModelPath { get; set; } = null!;
}
