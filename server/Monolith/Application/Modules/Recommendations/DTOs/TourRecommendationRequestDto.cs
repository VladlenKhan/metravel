namespace Application.Modules.Recommendations.DTOs;

public class TourRecommendationRequestDto
{
    public string? Country { get; set; }

    public string? City { get; set; }

    public decimal? Budget { get; set; }

    public int? DesiredDurationDays { get; set; }

    public int? PreferredMonth { get; set; }

    public int Top { get; set; } = 5;
}
