namespace MeTravel.Contracts.Bookings;

public class BookingStatusChangedIntegrationEvent
{
    public Guid BookingId { get; set; }

    public string Status { get; set; } = null!;
}
