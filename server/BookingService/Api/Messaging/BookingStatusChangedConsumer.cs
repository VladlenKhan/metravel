using BookingService.Application.Interfaces;
using MassTransit;
using MeTravel.Contracts.Bookings;

namespace BookingService.Api.Messaging;

public class BookingStatusChangedConsumer : IConsumer<BookingStatusChangedIntegrationEvent>
{
    private readonly ILogger<BookingStatusChangedConsumer> _logger;
    private readonly IBookingService _bookingService;

    public BookingStatusChangedConsumer(
        ILogger<BookingStatusChangedConsumer> logger,
        IBookingService bookingService)
    {
        _logger = logger;
        _bookingService = bookingService;
    }

    public async Task Consume(ConsumeContext<BookingStatusChangedIntegrationEvent> context)
    {
        var message = context.Message;

        _logger.LogInformation(
            "Received booking status change. BookingId={BookingId}, Status={Status}",
            message.BookingId,
            message.Status);

        await _bookingService.ChangeStatusAsync(message, context.CancellationToken);
    }
}
