using System.Text.Json;
using Application.Modules.Bookings.Interfaces;
using Application.Modules.Messaging.Interfaces;
using MeTravel.Contracts.Bookings;

namespace Infrastructure.Modules.Bookings.Messaging;

public class BookingEventPublisher : IBookingEventPublisher
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly IRabbitMqPublisher _publisher;

    public BookingEventPublisher(IRabbitMqPublisher publisher)
    {
        _publisher = publisher;
    }

    public async Task PublishRequestedAsync(BookingRequestedIntegrationEvent message, CancellationToken cancellationToken = default)
    {
        var payload = JsonSerializer.Serialize(message, JsonOptions);
        await _publisher.PublishAsync("booking.requests", payload, cancellationToken);
    }

    public async Task PublishStatusChangedAsync(BookingStatusChangedIntegrationEvent message, CancellationToken cancellationToken = default)
    {
        var payload = JsonSerializer.Serialize(message, JsonOptions);
        await _publisher.PublishAsync("booking.status", payload, cancellationToken);
    }
}
