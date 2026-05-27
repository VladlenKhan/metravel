namespace Application.Modules.Tours.DTOs;

public class UpdateTourServiceDto
{
    public bool IsIncluded { get; set; } = true;

    public decimal? AdditionalPrice { get; set; }
}
