using BookingService.Domain.Entities;

namespace BookingService.Application.Interfaces;

public interface IBookingRepository
{
    Task<Booking?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default);

    Task<Booking> AddAsync(Booking booking, CancellationToken cancellationToken = default);

    Task<Booking> UpdateAsync(Booking booking, CancellationToken cancellationToken = default);
}
