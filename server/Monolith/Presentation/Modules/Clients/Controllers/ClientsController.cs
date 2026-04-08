using System.Security.Claims;
using Application.Modules.Auth.Authorization;
using Application.Modules.Clients.DTOs;
using Application.Modules.Clients.Interfaces;
using Microsoft.AspNetCore.Authorization;
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

    [HttpGet]
    [Authorize(Policy = AuthorizationPolicies.StaffOnly)]
    public async Task<ActionResult<IReadOnlyList<ClientDto>>> GetAll(CancellationToken cancellationToken)
    {
        var clients = await _clientService.GetAllAsync(cancellationToken);
        return Ok(clients);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.StaffOnly)]
    public async Task<ActionResult<ClientDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var client = await _clientService.GetByIdAsync(id, cancellationToken);
        if (client is null)
        {
            return NotFound();
        }

        return Ok(client);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<ClientDto>> GetMyClient(CancellationToken cancellationToken)
    {
        var clientIdValue = User.FindFirstValue("client_id");
        if (!Guid.TryParse(clientIdValue, out var clientId))
        {
            return Forbid();
        }

        var client = await _clientService.GetByIdAsync(clientId, cancellationToken);
        if (client is null)
        {
            return NotFound();
        }

        return Ok(client);
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.StaffOnly)]
    public async Task<ActionResult<ClientDto>> Create([FromBody] ClientDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var created = await _clientService.CreateAsync(dto, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.StaffOnly)]
    public async Task<ActionResult<ClientDto>> Update(Guid id, [FromBody] ClientDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var updated = await _clientService.UpdateAsync(id, dto, cancellationToken);
            if (updated is null)
            {
                return NotFound();
            }

            return Ok(updated);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.StaffOnly)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await _clientService.DeleteAsync(id, cancellationToken);
        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }
}
