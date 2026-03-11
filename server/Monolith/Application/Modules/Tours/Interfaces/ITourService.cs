namespace Application.Modules.Tours.Interfaces;

using Application.Modules.Tours.DTOs;

public interface ITourService
{
    Task<IReadOnlyList<TourDto>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<TourDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<TourDto> CreateAsync(TourDto dto, CancellationToken cancellationToken = default);

    Task<TourDto?> UpdateAsync(Guid id, TourDto dto, CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    
}
