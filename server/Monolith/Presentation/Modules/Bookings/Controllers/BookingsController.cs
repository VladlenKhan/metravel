using Application.Modules.Bookings.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Modules.Bookings.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BookingsController : ControllerBase
{
    private readonly IBookingService _bookingService;

    public BookingsController(IBookingService bookingService)
    {
        _bookingService = bookingService;
    }
}

