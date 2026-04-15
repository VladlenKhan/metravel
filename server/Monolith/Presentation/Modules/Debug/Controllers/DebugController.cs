using Application.Modules.Bookings.Interfaces;
using Microsoft.AspNetCore.Mvc;
using MeTravel.Contracts.Bookings;

namespace Presentation.Modules.Debug.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DebugController : ControllerBase
{
    private readonly IBookingEventPublisher _bookingEventPublisher;

    public DebugController(IBookingEventPublisher bookingEventPublisher)
    {
        _bookingEventPublisher = bookingEventPublisher;
    }

    [HttpPost("send-booking-test")]
    public async Task<IActionResult> SendBookingTest(CancellationToken cancellationToken)
    {
        var message = new BookingRequestedIntegrationEvent
        {
            BookingId = Guid.NewGuid(),
            ClientId = Guid.NewGuid(),
            TourId = Guid.NewGuid(),
            TotalPrice = 1000m,
            BookingDate = DateTime.UtcNow
        };

        await _bookingEventPublisher.PublishRequestedAsync(message, cancellationToken);
        return Ok(new { sent = true, message });
    }
}
