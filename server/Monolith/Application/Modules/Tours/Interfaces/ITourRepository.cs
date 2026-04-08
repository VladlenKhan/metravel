using Domain.Tours;

namespace Application.Modules.Tours.Interfaces;

public interface ITourRepository
{
    Task<IReadOnlyList<Tour>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<Tour?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<Tour> AddAsync(Tour tour, CancellationToken cancellationToken = default);

    Task<Tour?> UpdateAsync(Tour tour, CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    
}
