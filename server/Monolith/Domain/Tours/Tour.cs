using Domain.Bookings;
using Domain.Services;

namespace Domain.Tours;

public class Tour
{
    public Guid Id { get; set; }

    public string Title { get; set; } = null!;

    public string City { get; set; } = null!;

    public string Country { get; set; } = null!;

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public decimal BasePrice { get; set; }

    public int TotalSeats { get; set; }

    public int AvailableSeats { get; set; }

    public string? Description { get; set; }

    public ICollection<TourService> TourServices { get; set; } = new List<TourService>();

    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
