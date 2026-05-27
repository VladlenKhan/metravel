using Domain.Tours;

namespace Domain.Services;

public class TourService
{
    public Guid TourId { get; set; }

    public Guid ServiceId { get; set; }

    public bool IsIncluded { get; set; } = true;

    public decimal? AdditionalPrice { get; set; }

    public Tour Tour { get; set; } = null!;

    public Service Service { get; set; } = null!;
}

