using Application.Modules.Bookings.DTOs;

namespace Application.Modules.Bookings.Interfaces;

public interface IBookingCommandService
{
    Task<Guid> RequestAsync(CreateBookingDto dto, CancellationToken cancellationToken = default);

    Task ChangeStatusAsync(Guid bookingId, ChangeBookingStatusDto dto, CancellationToken cancellationToken = default);
}
