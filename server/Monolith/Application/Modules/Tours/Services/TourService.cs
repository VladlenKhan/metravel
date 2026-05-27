using Application.Modules.Tours.DTOs;
using Application.Modules.Tours.Interfaces;
using Domain.Tours;

namespace Application.Modules.Tours.Services;

public class TourService : ITourService
{
    private readonly ITourRepository _tourRepository;

    public TourService(ITourRepository tourRepository)
    {
        _tourRepository = tourRepository;
    }

    public async Task<IReadOnlyList<TourDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var tours = await _tourRepository.GetAllAsync(cancellationToken);
        return tours.Select(MapToDto).ToList();
    }

    public async Task<TourDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var tour = await _tourRepository.GetByIdAsync(id, cancellationToken);
        return tour is null ? null : MapToDto(tour);
    }

    public async Task<TourDto> CreateAsync(TourDto dto, CancellationToken cancellationToken = default)
    {
        var entity = MapToEntity(dto);
        entity.Id = Guid.NewGuid();

        var created = await _tourRepository.AddAsync(entity, cancellationToken);
        return MapToDto(created);
    }

    public async Task<TourDto?> UpdateAsync(Guid id, TourDto dto, CancellationToken cancellationToken = default)
    {
        var existing = await _tourRepository.GetByIdAsync(id, cancellationToken);
        if (existing is null)
        {
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
        return updated is null ? null : MapToDto(updated);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _tourRepository.DeleteAsync(id, cancellationToken);
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
    
}
