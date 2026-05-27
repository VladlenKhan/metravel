namespace MeTravel.Contracts.Bookings;

public class BookingRequestedIntegrationEvent
{
    public Guid BookingId { get; set; }

    public Guid ClientId { get; set; }

    public Guid TourId { get; set; }

    public decimal TotalPrice { get; set; }

    public DateTime BookingDate { get; set; }
}
