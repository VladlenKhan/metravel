using Application.Modules.Messaging.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Modules.Debug.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DebugController : ControllerBase
{
    private readonly IRabbitMqPublisher _publisher;

    public DebugController(IRabbitMqPublisher publisher)
    {
        _publisher = publisher;
    }

    [HttpPost("send-booking-test")]
    public async Task<IActionResult> SendBookingTest(CancellationToken cancellationToken)
    {
        var message = $"Test booking message at {DateTime.UtcNow:O}";
        await _publisher.PublishAsync("booking.requests", message, cancellationToken);
        return Ok(new { sent = true, message });
    }
}

