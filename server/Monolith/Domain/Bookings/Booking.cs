using Domain.Clients;
using Domain.Tours;

namespace Domain.Bookings;

public class Booking
{
    public Guid Id { get; set; }

    public Guid ClientId { get; set; }

    public Guid TourId { get; set; }

    public DateTime BookingDate { get; set; }

    public string EmployeeName { get; set; } = null!;

    public decimal DiscountPercent { get; set; }

    public decimal FinalPrice { get; set; }

    public BookingStatus Status { get; set; }

    public Client Client { get; set; } = null!;

    public Tour Tour { get; set; } = null!;
}
