using BookingService.Application.Interfaces;
using BookingService.Domain.Entities;
using MeTravel.Contracts.Bookings;

namespace BookingService.Application.Services;

public class BookingApplicationService : IBookingService
{
    private readonly IBookingRepository _bookingRepository;

    public BookingApplicationService(IBookingRepository bookingRepository)
    {
        _bookingRepository = bookingRepository;
    }

    public async Task<Booking?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _bookingRepository.GetByIdAsync(id, cancellationToken);
    }

    public async Task<Booking> CreateAsync(BookingRequestedIntegrationEvent request, CancellationToken cancellationToken = default)
    {
        var existingBooking = await _bookingRepository.GetByIdAsync(request.BookingId, cancellationToken);
        if (existingBooking is not null)
        {
            return existingBooking;
        }

        var booking = new Booking
        {
            Id = request.BookingId,
            ClientId = request.ClientId,
            TourId = request.TourId,
            BookingDate = request.BookingDate == default ? DateTime.UtcNow : request.BookingDate,
            TotalPrice = request.TotalPrice,
            Status = BookingStatus.Created
        };

        return await _bookingRepository.AddAsync(booking, cancellationToken);
    }

    public async Task<Booking?> ChangeStatusAsync(BookingStatusChangedIntegrationEvent request, CancellationToken cancellationToken = default)
    {
        var booking = await _bookingRepository.GetByIdAsync(request.BookingId, cancellationToken);
        if (booking is null)
        {
            return null;
        }

        if (!Enum.TryParse<BookingStatus>(request.Status, ignoreCase: true, out var newStatus))
        {
            return booking;
        }

        if (booking.Status == newStatus)
        {
            return booking;
        }

        if (!CanChangeStatus(booking.Status, newStatus))
        {
            return booking;
        }

        booking.Status = newStatus;
        return await _bookingRepository.UpdateAsync(booking, cancellationToken);
    }

    private static bool CanChangeStatus(BookingStatus currentStatus, BookingStatus newStatus)
    {
        return (currentStatus, newStatus) switch
        {
            (BookingStatus.Created, BookingStatus.Confirmed) => true,
            (BookingStatus.Created, BookingStatus.Cancelled) => true,
            (BookingStatus.Confirmed, BookingStatus.Cancelled) => true,
            (BookingStatus.Confirmed, BookingStatus.Completed) => true,
            _ => false
        };
    }
}
