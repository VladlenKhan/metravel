using System.Security.Claims;
using Application.Modules.Auth.Authorization;
using Application.Modules.Bookings.DTOs;
using Application.Modules.Bookings.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Modules.Bookings.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BookingsController : ControllerBase
{
    private readonly IBookingCommandService _bookingCommandService;

    public BookingsController(IBookingCommandService bookingCommandService)
    {
        _bookingCommandService = bookingCommandService;
    }

    [HttpPost]
    public async Task<IActionResult> RequestBooking([FromBody] CreateBookingDto dto, CancellationToken cancellationToken)
    {
        if (User.IsInRole(AppRoles.Client))
        {
            var clientIdValue = User.FindFirstValue("client_id");
            if (!Guid.TryParse(clientIdValue, out var clientId))
            {
                return Forbid();
            }

            dto.ClientId = clientId;
        }
        else if (!User.IsInRole(AppRoles.Admin) && !User.IsInRole(AppRoles.Operator))
        {
            return Forbid();
        }

        try
        {
            var bookingId = await _bookingCommandService.RequestAsync(dto, cancellationToken);
            return Accepted(new { bookingId });
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPost("{id:guid}/status")]
    [Authorize(Policy = AuthorizationPolicies.StaffOnly)]
    public async Task<IActionResult> ChangeStatus(Guid id, [FromBody] ChangeBookingStatusDto dto, CancellationToken cancellationToken)
    {
        try
        {
            await _bookingCommandService.ChangeStatusAsync(id, dto, cancellationToken);
            return Accepted(new { bookingId = id, dto.Status });
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }
}
