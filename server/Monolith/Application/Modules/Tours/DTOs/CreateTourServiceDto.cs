namespace Application.Modules.Tours.DTOs;

public class CreateTourServiceDto
{
    public Guid ServiceId { get; set; }

    public bool IsIncluded { get; set; } = true;

    public decimal? AdditionalPrice { get; set; }
}
