using Application.Modules.Services.DTOs;

namespace Application.Modules.Services.Interfaces;

public interface IServiceService
{
    Task<IReadOnlyList<ServiceDto>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<ServiceDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<ServiceDto> CreateAsync(ServiceDto dto, CancellationToken cancellationToken = default);

    Task<ServiceDto?> UpdateAsync(Guid id, ServiceDto dto, CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
