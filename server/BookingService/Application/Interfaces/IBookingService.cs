using BookingService.Domain.Entities;
using MeTravel.Contracts.Bookings;

namespace BookingService.Application.Interfaces;

public interface IBookingService
{
    Task<Booking?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<Booking> CreateAsync(BookingRequestedIntegrationEvent request, CancellationToken cancellationToken = default);

    Task<Booking?> ChangeStatusAsync(BookingStatusChangedIntegrationEvent request, CancellationToken cancellationToken = default);
}
