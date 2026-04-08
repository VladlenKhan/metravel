using Application.Modules.Audit.Interfaces;
using Application.Modules.Tours.DTOs;
using Application.Modules.Tours.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Presentation.Modules.Tours.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ToursController : ControllerBase
{
    private readonly ITourService _tourService;
    private readonly IAuditService _auditService;
    private readonly ILogger<ToursController> _logger;

    public ToursController(ITourService tourService, IAuditService auditService, ILogger<ToursController> logger)
    {
        _tourService = tourService;
        _auditService = auditService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TourDto>>> GetAll(CancellationToken cancellationToken)
    {
        var tours = await _tourService.GetAllAsync(cancellationToken);
        return Ok(tours);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TourDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var tour = await _tourService.GetByIdAsync(id, cancellationToken);
        if (tour is null)
        {
            return NotFound();
        }

        return Ok(tour);
    }

    [HttpPost]
    public async Task<ActionResult<TourDto>> Create([FromBody] TourDto dto, CancellationToken cancellationToken)
    {
        var created = await _tourService.CreateAsync(dto, cancellationToken);
        _logger.LogInformation("Тур создан. Id={TourId}, Название={Title}", created.Id, created.Title);
        await _auditService.WriteAsync(
            action: "Create",
            entityType: "Tour",
            entityId: created.Id.ToString(),
            success: true,
            details: $"Создан тур \"{created.Title}\"",
            cancellationToken: cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TourDto>> Update(Guid id, [FromBody] TourDto dto, CancellationToken cancellationToken)
    {
        var updated = await _tourService.UpdateAsync(id, dto, cancellationToken);
        if (updated is null)
        {
            _logger.LogWarning("Попытка обновить несуществующий тур. Id={TourId}", id);
            await _auditService.WriteAsync(
                action: "Update",
                entityType: "Tour",
                entityId: id.ToString(),
                success: false,
                details: "Тур не найден при обновлении",
                cancellationToken: cancellationToken);
            return NotFound();
        }

        _logger.LogInformation("Тур обновлён. Id={TourId}, Новое название={Title}", id, updated.Title);
        await _auditService.WriteAsync(
            action: "Update",
            entityType: "Tour",
            entityId: id.ToString(),
            success: true,
            details: $"Тур обновлён на \"{updated.Title}\"",
            cancellationToken: cancellationToken);
        return Ok(updated);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await _tourService.DeleteAsync(id, cancellationToken);
        if (!deleted)
        {
            _logger.LogWarning("Попытка удалить несуществующий тур. Id={TourId}", id);
            await _auditService.WriteAsync(
                action: "Delete",
                entityType: "Tour",
                entityId: id.ToString(),
                success: false,
                details: "Тур не найден при удалении",
                cancellationToken: cancellationToken);
            return NotFound();
        }

        _logger.LogInformation("Тур удалён. Id={TourId}", id);
        await _auditService.WriteAsync(
            action: "Delete",
            entityType: "Tour",
            entityId: id.ToString(),
            success: true,
            details: "Тур успешно удалён",
            cancellationToken: cancellationToken);
        return NoContent();
    }
    
}
