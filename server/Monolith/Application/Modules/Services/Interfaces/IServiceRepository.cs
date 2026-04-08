using Domain.Services;

namespace Application.Modules.Services.Interfaces;

public interface IServiceRepository
{
    Task<IReadOnlyList<Service>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<Service?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<Service> AddAsync(Service service, CancellationToken cancellationToken = default);

    Task<Service?> UpdateAsync(Service service, CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
