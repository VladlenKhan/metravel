using Application.Modules.Audit.Interfaces;
using Application.Modules.Services.Interfaces;
using Application.Modules.Tours.DTOs;
using Application.Modules.Tours.Interfaces;
using Domain.Tours;
using Microsoft.Extensions.Logging;
using TourServiceLink = Domain.Services.TourService;

namespace Application.Modules.Tours.Services;

public class TourService : ITourService
{
    private readonly ITourRepository _tourRepository;
    private readonly IServiceRepository _serviceRepository;
    private readonly IAuditService _auditService;
    private readonly ILogger<TourService> _logger;

    public TourService(
        ITourRepository tourRepository,
        IServiceRepository serviceRepository,
        IAuditService auditService,
        ILogger<TourService> logger)
    {
        _tourRepository = tourRepository;
        _serviceRepository = serviceRepository;
        _auditService = auditService;
        _logger = logger;
    }

    public async Task<IReadOnlyList<TourDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var tours = await _tourRepository.GetAllAsync(cancellationToken);
        return tours.Select(MapToDto).ToList();
    }

    public async Task<TourDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var tour = await _tourRepository.GetByIdAsync(id, cancellationToken);
        if (tour is null)
        {
            return null;
        }

        return MapToDto(tour);
    }

    public async Task<TourDto> CreateAsync(TourDto dto, CancellationToken cancellationToken = default)
    {
        var entity = MapToEntity(dto);
        entity.Id = Guid.NewGuid();

        var created = await _tourRepository.AddAsync(entity, cancellationToken);
        _logger.LogInformation("Тур создан. Id={TourId}, Название={Title}", created.Id, created.Title);
        await _auditService.WriteAsync(
            action: "Create",
            entityType: "Tour",
            entityId: created.Id.ToString(),
            success: true,
            details: $"Создан тур \"{created.Title}\"",
            cancellationToken: cancellationToken);
        return MapToDto(created);
    }

    public async Task<TourDto?> UpdateAsync(Guid id, TourDto dto, CancellationToken cancellationToken = default)
    {
        var existing = await _tourRepository.GetByIdAsync(id, cancellationToken);
        if (existing is null)
        {
            _logger.LogWarning("Попытка обновить несуществующий тур. Id={TourId}", id);
            await _auditService.WriteAsync(
                action: "Update",
                entityType: "Tour",
                entityId: id.ToString(),
                success: false,
                details: "Тур не найден при обновлении",
                cancellationToken: cancellationToken);
            return null;
        }

        existing.Title = dto.Title;
        existing.City = dto.City;
        existing.Country = dto.Country;
        existing.StartDate = dto.StartDate;
        existing.EndDate = dto.EndDate;
        existing.BasePrice = dto.BasePrice;
        existing.TotalSeats = dto.TotalSeats;
        existing.AvailableSeats = dto.AvailableSeats;
        existing.Description = dto.Description;

        var updated = await _tourRepository.UpdateAsync(existing, cancellationToken);
        if (updated is null)
        {
            _logger.LogWarning("Не удалось обновить тур. Id={TourId}", id);
            await _auditService.WriteAsync(
                action: "Update",
                entityType: "Tour",
                entityId: id.ToString(),
                success: false,
                details: "Обновление тура завершилось без результата",
                cancellationToken: cancellationToken);
            return null;
        }

        _logger.LogInformation("Тур обновлён. Id={TourId}, Новое название={Title}", id, updated.Title);
        await _auditService.WriteAsync(
            action: "Update",
            entityType: "Tour",
            entityId: id.ToString(),
            success: true,
            details: $"Тур обновлён на \"{updated.Title}\"",
            cancellationToken: cancellationToken);
        return MapToDto(updated);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var deleted = await _tourRepository.DeleteAsync(id, cancellationToken);
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
            return false;
        }

        _logger.LogInformation("Тур удалён. Id={TourId}", id);
        await _auditService.WriteAsync(
            action: "Delete",
            entityType: "Tour",
            entityId: id.ToString(),
            success: true,
            details: "Тур успешно удалён",
            cancellationToken: cancellationToken);
        return true;
    }

    public async Task<IReadOnlyList<TourLinkedServiceDto>?> GetServicesAsync(Guid tourId, CancellationToken cancellationToken = default)
    {
        var tour = await _tourRepository.GetByIdWithServicesAsync(tourId, cancellationToken);
        if (tour is null)
        {
            return null;
        }

        return tour.TourServices
            .OrderBy(ts => ts.Service.Name)
            .Select(MapToLinkedServiceDto)
            .ToList();
    }

    public async Task<TourLinkedServiceDto?> AddServiceAsync(
        Guid tourId,
        CreateTourServiceDto dto,
        CancellationToken cancellationToken = default)
    {
        var tour = await _tourRepository.GetByIdAsync(tourId, cancellationToken);
        if (tour is null)
        {
            await WriteTourServiceAuditAsync("AddService", tourId, dto.ServiceId, false, "Тур не найден", cancellationToken);
            return null;
        }

        var service = await _serviceRepository.GetByIdAsync(dto.ServiceId, cancellationToken);
        if (service is null)
        {
            throw new InvalidOperationException("Service was not found.");
        }

        var existingLink = await _tourRepository.GetTourServiceAsync(tourId, dto.ServiceId, cancellationToken);
        if (existingLink is not null)
        {
            throw new InvalidOperationException("Service is already linked to this tour.");
        }

        var link = new TourServiceLink
        {
            TourId = tourId,
            ServiceId = dto.ServiceId,
            IsIncluded = dto.IsIncluded,
            AdditionalPrice = dto.AdditionalPrice
        };

        var created = await _tourRepository.AddTourServiceAsync(link, cancellationToken);

        _logger.LogInformation("Услуга привязана к туру. TourId={TourId}, ServiceId={ServiceId}", tourId, dto.ServiceId);
        await WriteTourServiceAuditAsync("AddService", tourId, dto.ServiceId, true, "Услуга привязана к туру", cancellationToken);

        return MapToLinkedServiceDto(created);
    }

    public async Task<TourLinkedServiceDto?> UpdateServiceAsync(
        Guid tourId,
        Guid serviceId,
        UpdateTourServiceDto dto,
        CancellationToken cancellationToken = default)
    {
        var existingLink = await _tourRepository.GetTourServiceAsync(tourId, serviceId, cancellationToken);
        if (existingLink is null)
        {
            await WriteTourServiceAuditAsync("UpdateService", tourId, serviceId, false, "Связь тура и услуги не найдена", cancellationToken);
            return null;
        }

        existingLink.IsIncluded = dto.IsIncluded;
        existingLink.AdditionalPrice = dto.AdditionalPrice;

        var updated = await _tourRepository.UpdateTourServiceAsync(existingLink, cancellationToken);
        if (updated is null)
        {
            await WriteTourServiceAuditAsync("UpdateService", tourId, serviceId, false, "Не удалось обновить связь тура и услуги", cancellationToken);
            return null;
        }

        _logger.LogInformation("Связь тура и услуги обновлена. TourId={TourId}, ServiceId={ServiceId}", tourId, serviceId);
        await WriteTourServiceAuditAsync("UpdateService", tourId, serviceId, true, "Связь тура и услуги обновлена", cancellationToken);

        return MapToLinkedServiceDto(updated);
    }

    public async Task<bool> DeleteServiceAsync(Guid tourId, Guid serviceId, CancellationToken cancellationToken = default)
    {
        var deleted = await _tourRepository.DeleteTourServiceAsync(tourId, serviceId, cancellationToken);
        if (!deleted)
        {
            await WriteTourServiceAuditAsync("DeleteService", tourId, serviceId, false, "Связь тура и услуги не найдена", cancellationToken);
            return false;
        }

        _logger.LogInformation("Услуга удалена из тура. TourId={TourId}, ServiceId={ServiceId}", tourId, serviceId);
        await WriteTourServiceAuditAsync("DeleteService", tourId, serviceId, true, "Услуга удалена из тура", cancellationToken);

        return true;
    }

    private static TourDto MapToDto(Tour tour)
    {
        return new TourDto
        {
            Id = tour.Id,
            Title = tour.Title,
            City = tour.City,
            Country = tour.Country,
            StartDate = tour.StartDate,
            EndDate = tour.EndDate,
            BasePrice = tour.BasePrice,
            TotalSeats = tour.TotalSeats,
            AvailableSeats = tour.AvailableSeats,
            Description = tour.Description
        };
    }

    private static Tour MapToEntity(TourDto dto)
    {
        return new Tour
        {
            Id = dto.Id,
            Title = dto.Title,
            City = dto.City,
            Country = dto.Country,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            BasePrice = dto.BasePrice,
            TotalSeats = dto.TotalSeats,
            AvailableSeats = dto.AvailableSeats,
            Description = dto.Description
        };
    }

    private async Task WriteTourServiceAuditAsync(
        string action,
        Guid tourId,
        Guid serviceId,
        bool success,
        string details,
        CancellationToken cancellationToken)
    {
        await _auditService.WriteAsync(
            action: action,
            entityType: "TourService",
            entityId: $"{tourId}:{serviceId}",
            success: success,
            details: details,
            cancellationToken: cancellationToken);
    }

    private static TourLinkedServiceDto MapToLinkedServiceDto(TourServiceLink tourService)
    {
        return new TourLinkedServiceDto
        {
            ServiceId = tourService.ServiceId,
            Name = tourService.Service.Name,
            Description = tourService.Service.Description,
            Price = tourService.Service.Price,
            IsIncluded = tourService.IsIncluded,
            AdditionalPrice = tourService.AdditionalPrice
        };
    }
}
