namespace Application.Modules.Recommendations.DTOs;

public class TourRecommendationDto
{
    public Guid TourId { get; set; }

    public string Title { get; set; } = null!;

    public string Country { get; set; } = null!;

    public string City { get; set; } = null!;

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public int DurationDays { get; set; }

    public decimal BasePrice { get; set; }

    public double Score { get; set; }

    public string Explanation { get; set; } = null!;
}
