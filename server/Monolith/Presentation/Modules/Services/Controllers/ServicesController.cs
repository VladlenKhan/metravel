using Application.Modules.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Modules.Services.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServicesController : ControllerBase
{
    private readonly IServiceService _serviceService;

    public ServicesController(IServiceService serviceService)
    {
        _serviceService = serviceService;
    }
}

