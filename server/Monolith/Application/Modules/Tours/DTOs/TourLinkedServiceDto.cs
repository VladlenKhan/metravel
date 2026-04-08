namespace Application.Modules.Tours.DTOs;

public class TourLinkedServiceDto
{
    public Guid ServiceId { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public decimal? Price { get; set; }

    public bool IsIncluded { get; set; }

    public decimal? AdditionalPrice { get; set; }
}
