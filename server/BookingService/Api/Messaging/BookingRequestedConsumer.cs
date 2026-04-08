using BookingService.Application.Interfaces;
using MassTransit;
using MeTravel.Contracts.Bookings;

namespace BookingService.Api.Messaging;

public class BookingRequestedConsumer : IConsumer<BookingRequestedIntegrationEvent>
{
    private readonly ILogger<BookingRequestedConsumer> _logger;
    private readonly IBookingService _bookingService;

    public BookingRequestedConsumer(
        ILogger<BookingRequestedConsumer> logger,
        IBookingService bookingService)
    {
        _logger = logger;
        _bookingService = bookingService;
    }

    public async Task Consume(ConsumeContext<BookingRequestedIntegrationEvent> context)
    {
        var message = context.Message;

        _logger.LogInformation(
            "Received booking request. BookingId={BookingId}, ClientId={ClientId}, TourId={TourId}",
            message.BookingId,
            message.ClientId,
            message.TourId);

        await _bookingService.CreateAsync(message, context.CancellationToken);

        
    }
}
