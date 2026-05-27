using MeTravel.Contracts.Bookings;

namespace Application.Modules.Bookings.Interfaces;

public interface IBookingEventPublisher
{
    Task PublishRequestedAsync(BookingRequestedIntegrationEvent message, CancellationToken cancellationToken = default);

    Task PublishStatusChangedAsync(BookingStatusChangedIntegrationEvent message, CancellationToken cancellationToken = default);
}
