using Application.Modules.Clients.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Modules.Clients.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClientsController : ControllerBase
{
    private readonly IClientService _clientService;

    public ClientsController(IClientService clientService)
    {
        _clientService = clientService;
    }
}

