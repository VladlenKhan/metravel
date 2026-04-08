using Domain.Tours;
using TourServiceLink = Domain.Services.TourService;

namespace Application.Modules.Tours.Interfaces;

public interface ITourRepository
{
    Task<IReadOnlyList<Tour>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<Tour?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<Tour> AddAsync(Tour tour, CancellationToken cancellationToken = default);

    Task<Tour?> UpdateAsync(Tour tour, CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);

    Task<Tour?> GetByIdWithServicesAsync(Guid id, CancellationToken cancellationToken = default);

    Task<TourServiceLink?> GetTourServiceAsync(Guid tourId, Guid serviceId, CancellationToken cancellationToken = default);

    Task<TourServiceLink> AddTourServiceAsync(TourServiceLink tourService, CancellationToken cancellationToken = default);

    Task<TourServiceLink?> UpdateTourServiceAsync(TourServiceLink tourService, CancellationToken cancellationToken = default);

    Task<bool> DeleteTourServiceAsync(Guid tourId, Guid serviceId, CancellationToken cancellationToken = default);
}
