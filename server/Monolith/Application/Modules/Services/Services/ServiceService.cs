using Application.Modules.Audit.Interfaces;
using Application.Modules.Services.DTOs;
using Application.Modules.Services.Interfaces;
using Domain.Services;
using Microsoft.Extensions.Logging;

namespace Application.Modules.Services.Services;

public class ServiceService : IServiceService
{
    private readonly IServiceRepository _serviceRepository;
    private readonly IAuditService _auditService;
    private readonly ILogger<ServiceService> _logger;

    public ServiceService(
        IServiceRepository serviceRepository,
        IAuditService auditService,
        ILogger<ServiceService> logger)
    {
        _serviceRepository = serviceRepository;
        _auditService = auditService;
        _logger = logger;
    }

    public async Task<IReadOnlyList<ServiceDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var services = await _serviceRepository.GetAllAsync(cancellationToken);
        return services.Select(MapToDto).ToList();
    }

    public async Task<ServiceDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var service = await _serviceRepository.GetByIdAsync(id, cancellationToken);
        return service is null ? null : MapToDto(service);
    }

    public async Task<ServiceDto> CreateAsync(ServiceDto dto, CancellationToken cancellationToken = default)
    {
        var service = MapToEntity(dto);
        service.Id = Guid.NewGuid();
        service.Name = service.Name.Trim();
        service.Description = service.Description?.Trim();

        var created = await _serviceRepository.AddAsync(service, cancellationToken);
        _logger.LogInformation("Услуга создана. Id={ServiceId}, Name={ServiceName}", created.Id, created.Name);
        await _auditService.WriteAsync(
            action: "Create",
            entityType: "Service",
            entityId: created.Id.ToString(),
            success: true,
            details: $"Создана услуга \"{created.Name}\"",
            cancellationToken: cancellationToken);
        return MapToDto(created);
    }

    public async Task<ServiceDto?> UpdateAsync(Guid id, ServiceDto dto, CancellationToken cancellationToken = default)
    {
        var existing = await _serviceRepository.GetByIdAsync(id, cancellationToken);
        if (existing is null)
        {
            _logger.LogWarning("Попытка обновить несуществующую услугу. Id={ServiceId}", id);
            await _auditService.WriteAsync(
                action: "Update",
                entityType: "Service",
                entityId: id.ToString(),
                success: false,
                details: "Услуга не найдена при обновлении",
                cancellationToken: cancellationToken);
            return null;
        }

        existing.Name = dto.Name.Trim();
        existing.Description = dto.Description?.Trim();
        existing.Price = dto.Price;

        var updated = await _serviceRepository.UpdateAsync(existing, cancellationToken);
        if (updated is null)
        {
            _logger.LogWarning("Не удалось обновить услугу. Id={ServiceId}", id);
            await _auditService.WriteAsync(
                action: "Update",
                entityType: "Service",
                entityId: id.ToString(),
                success: false,
                details: "Обновление услуги завершилось без результата",
                cancellationToken: cancellationToken);
            return null;
        }

        _logger.LogInformation("Услуга обновлена. Id={ServiceId}, Name={ServiceName}", updated.Id, updated.Name);
        await _auditService.WriteAsync(
            action: "Update",
            entityType: "Service",
            entityId: updated.Id.ToString(),
            success: true,
            details: $"Обновлена услуга \"{updated.Name}\"",
            cancellationToken: cancellationToken);
        return MapToDto(updated);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var deleted = await _serviceRepository.DeleteAsync(id, cancellationToken);
        if (!deleted)
        {
            _logger.LogWarning("Попытка удалить несуществующую услугу. Id={ServiceId}", id);
            await _auditService.WriteAsync(
                action: "Delete",
                entityType: "Service",
                entityId: id.ToString(),
                success: false,
                details: "Услуга не найдена при удалении",
                cancellationToken: cancellationToken);
            return false;
        }

        _logger.LogInformation("Услуга удалена. Id={ServiceId}", id);
        await _auditService.WriteAsync(
            action: "Delete",
            entityType: "Service",
            entityId: id.ToString(),
            success: true,
            details: "Услуга успешно удалена",
            cancellationToken: cancellationToken);
        return true;
    }

    private static ServiceDto MapToDto(Service service)
    {
        return new ServiceDto
        {
            Id = service.Id,
            Name = service.Name,
            Description = service.Description,
            Price = service.Price
        };
    }

    private static Service MapToEntity(ServiceDto dto)
    {
        return new Service
        {
            Id = dto.Id,
            Name = dto.Name,
            Description = dto.Description,
            Price = dto.Price
        };
    }
}
