using Application.Modules.Audit.Interfaces;
using Application.Modules.Clients.DTOs;
using Application.Modules.Clients.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Presentation.Modules.Clients.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClientsController : ControllerBase
{
    private readonly IClientService _clientService;
    private readonly IAuditService _auditService;
    private readonly ILogger<ClientsController> _logger;

    public ClientsController( IClientService clientService, IAuditService auditService, ILogger<ClientsController> logger)
    {
        _clientService = clientService;
        _auditService = auditService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ClientDto>>> GetAll(CancellationToken cancellationToken)
    {
        var clients = await _clientService.GetAllAsync(cancellationToken);
        return Ok(clients);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ClientDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var client = await _clientService.GetByIdAsync(id, cancellationToken);
        if (client is null)
        {
            return NotFound();
        }

        return Ok(client);
    }

    [HttpPost]
    public async Task<ActionResult<ClientDto>> Create([FromBody] ClientDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var created = await _clientService.CreateAsync(dto, cancellationToken);
            _logger.LogInformation("Клиент создан. Id={ClientId}, Email={Email}", created.Id, created.Email);
            await _auditService.WriteAsync(
                action: "Create",
                entityType: "Client",
                entityId: created.Id.ToString(),
                success: true,
                details: $"Создан клиент с email {created.Email}",
                cancellationToken: cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (InvalidOperationException exception)
        {
            _logger.LogWarning("Создание клиента отклонено. Email={Email}, Passport={PassportNumber}", dto.Email, dto.PassportNumber);
            await _auditService.WriteAsync(
                action: "Create",
                entityType: "Client",
                entityId: null,
                success: false,
                details: $"Создание клиента отклонено: {exception.Message}",
                cancellationToken: cancellationToken);
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ClientDto>> Update(Guid id, [FromBody] ClientDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var updated = await _clientService.UpdateAsync(id, dto, cancellationToken);
            if (updated is null)
            {
                _logger.LogWarning("Попытка обновить несуществующего клиента. Id={ClientId}", id);
                await _auditService.WriteAsync(
                    action: "Update",
                    entityType: "Client",
                    entityId: id.ToString(),
                    success: false,
                    details: "Клиент не найден при обновлении",
                    cancellationToken: cancellationToken);
                return NotFound();
            }

            _logger.LogInformation("Клиент обновлён. Id={ClientId}, Email={Email}", updated.Id, updated.Email);
            await _auditService.WriteAsync(
                action: "Update",
                entityType: "Client",
                entityId: updated.Id.ToString(),
                success: true,
                details: $"Обновлён клиент с email {updated.Email}",
                cancellationToken: cancellationToken);
            return Ok(updated);
        }
        catch (InvalidOperationException exception)
        {
            _logger.LogWarning("Обновление клиента отклонено. Id={ClientId}, Email={Email}", id, dto.Email);
            await _auditService.WriteAsync(
                action: "Update",
                entityType: "Client",
                entityId: id.ToString(),
                success: false,
                details: $"Обновление клиента отклонено: {exception.Message}",
                cancellationToken: cancellationToken);
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await _clientService.DeleteAsync(id, cancellationToken);
        if (!deleted)
        {
            _logger.LogWarning("Попытка удалить несуществующего клиента. Id={ClientId}", id);
            await _auditService.WriteAsync(
                action: "Delete",
                entityType: "Client",
                entityId: id.ToString(),
                success: false,
                details: "Клиент не найден при удалении",
                cancellationToken: cancellationToken);
            return NotFound();
        }

        _logger.LogInformation("Клиент удалён. Id={ClientId}", id);
        await _auditService.WriteAsync(
            action: "Delete",
            entityType: "Client",
            entityId: id.ToString(),
            success: true,
            details: "Клиент успешно удалён",
            cancellationToken: cancellationToken);
        return NoContent();
    }
}
