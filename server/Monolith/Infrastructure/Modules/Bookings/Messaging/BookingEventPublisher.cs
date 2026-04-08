using Application.Modules.Bookings.Interfaces;
using MassTransit;
using MeTravel.Contracts.Bookings;

namespace Infrastructure.Modules.Bookings.Messaging;

public class BookingEventPublisher : IBookingEventPublisher
{
    private readonly IPublishEndpoint _publishEndpoint;

    public BookingEventPublisher(IPublishEndpoint publishEndpoint)
    {
        _publishEndpoint = publishEndpoint;
    }

    public async Task PublishRequestedAsync(BookingRequestedIntegrationEvent message, CancellationToken cancellationToken = default)
    {
        await _publishEndpoint.Publish(message, cancellationToken);
    }

    public async Task PublishStatusChangedAsync(BookingStatusChangedIntegrationEvent message, CancellationToken cancellationToken = default)
    {
        await _publishEndpoint.Publish(message, cancellationToken);
    }
}
