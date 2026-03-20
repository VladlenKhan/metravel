namespace BookingService.Domain.Bookings;

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
}
