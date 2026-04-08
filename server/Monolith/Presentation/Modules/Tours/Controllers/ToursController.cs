using Application.Modules.Auth.Authorization;
using Application.Modules.Tours.DTOs;
using Application.Modules.Tours.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Modules.Tours.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = AuthorizationPolicies.AdminOnly)]
public class ToursController : ControllerBase
{
    private readonly ITourService _tourService;

    public ToursController(ITourService tourService)
    {
        _tourService = tourService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<TourDto>>> GetAll(CancellationToken cancellationToken)
    {
        var tours = await _tourService.GetAllAsync(cancellationToken);
        return Ok(tours);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
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
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TourDto>> Update(Guid id, [FromBody] TourDto dto, CancellationToken cancellationToken)
    {
        var updated = await _tourService.UpdateAsync(id, dto, cancellationToken);
        if (updated is null)
        {
            return NotFound();
        }

        return Ok(updated);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await _tourService.DeleteAsync(id, cancellationToken);
        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }

    [HttpGet("{id:guid}/services")]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<TourLinkedServiceDto>>> GetServices(Guid id, CancellationToken cancellationToken)
    {
        var services = await _tourService.GetServicesAsync(id, cancellationToken);
        if (services is null)
        {
            return NotFound();
        }

        return Ok(services);
    }

    [HttpPost("{id:guid}/services")]
    public async Task<ActionResult<TourLinkedServiceDto>> AddService(
        Guid id,
        [FromBody] CreateTourServiceDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var created = await _tourService.AddServiceAsync(id, dto, cancellationToken);
            if (created is null)
            {
                return NotFound();
            }

            return Ok(created);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPut("{id:guid}/services/{serviceId:guid}")]
    public async Task<ActionResult<TourLinkedServiceDto>> UpdateService(
        Guid id,
        Guid serviceId,
        [FromBody] UpdateTourServiceDto dto,
        CancellationToken cancellationToken)
    {
        var updated = await _tourService.UpdateServiceAsync(id, serviceId, dto, cancellationToken);
        if (updated is null)
        {
            return NotFound();
        }

        return Ok(updated);
    }

    [HttpDelete("{id:guid}/services/{serviceId:guid}")]
    public async Task<IActionResult> DeleteService(Guid id, Guid serviceId, CancellationToken cancellationToken)
    {
        var deleted = await _tourService.DeleteServiceAsync(id, serviceId, cancellationToken);
        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }
}
