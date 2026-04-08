using Application.Modules.Bookings.DTOs;
using Application.Modules.Bookings.Interfaces;
using MeTravel.Contracts.Bookings;

namespace Application.Modules.Bookings.Services;

public class BookingCommandService : IBookingCommandService
{
    private readonly IBookingEventPublisher _bookingEventPublisher;

    public BookingCommandService(IBookingEventPublisher bookingEventPublisher)
    {
        _bookingEventPublisher = bookingEventPublisher;
    }

    public async Task<Guid> RequestAsync(CreateBookingDto dto, CancellationToken cancellationToken = default)
    {
        if (dto.ClientId == Guid.Empty)
        {
            throw new InvalidOperationException("ClientId is required.");
        }

        if (dto.TourId == Guid.Empty)
        {
            throw new InvalidOperationException("TourId is required.");
        }

        if (dto.TotalPrice <= 0)
        {
            throw new InvalidOperationException("TotalPrice must be greater than zero.");
        }

        var bookingId = Guid.NewGuid();
        var bookingDate = dto.BookingDate == default ? DateTime.UtcNow : dto.BookingDate;

        var message = new BookingRequestedIntegrationEvent
        {
            BookingId = bookingId,
            ClientId = dto.ClientId,
            TourId = dto.TourId,
            TotalPrice = dto.TotalPrice,
            BookingDate = bookingDate
        };

        await _bookingEventPublisher.PublishRequestedAsync(message, cancellationToken);

        return bookingId;
    }

    public async Task ChangeStatusAsync(Guid bookingId, ChangeBookingStatusDto dto, CancellationToken cancellationToken = default)
    {
        if (bookingId == Guid.Empty)
        {
            throw new InvalidOperationException("BookingId is required.");
        }

        if (string.IsNullOrWhiteSpace(dto.Status))
        {
            throw new InvalidOperationException("Status is required.");
        }

        if (string.Equals(dto.Status, "Created", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Status change to Created is not allowed.");
        }

        var message = new BookingStatusChangedIntegrationEvent
        {
            BookingId = bookingId,
            Status = dto.Status
        };

        await _bookingEventPublisher.PublishStatusChangedAsync(message, cancellationToken);
    }
}
