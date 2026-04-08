namespace BookingService.Domain.Entities;

public class Booking
{
    public Guid Id { get; set; }

    public Guid ClientId { get; set; }

    public Guid TourId { get; set; }

    public DateTime BookingDate { get; set; }

    public decimal TotalPrice { get; set; }

    public BookingStatus Status { get; set; }
}
