namespace Application.Modules.Bookings.DTOs;

public class CreateBookingDto
{
    public Guid ClientId { get; set; }

    public Guid TourId { get; set; }

    public decimal TotalPrice { get; set; }

    public DateTime BookingDate { get; set; }
}
