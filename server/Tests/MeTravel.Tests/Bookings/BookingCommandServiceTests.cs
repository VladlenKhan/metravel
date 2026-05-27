using Application.Modules.Bookings.DTOs;
using Application.Modules.Bookings.Interfaces;
using Application.Modules.Bookings.Services;
using MeTravel.Contracts.Bookings;
using Moq;
using Xunit;

namespace MeTravel.Tests.Bookings;

public class BookingCommandServiceTests
{
    private readonly Mock<IBookingEventPublisher> _publisherMock = new();

    private BookingCommandService CreateSut() => new(_publisherMock.Object);

    // --- Создание бронирования с корректными данными возвращает GUID ---
    [Fact]
    public async Task RequestAsync_WithValidData_ReturnsNonEmptyBookingId()
    {
        var dto = new CreateBookingDto
        {
            ClientId = Guid.NewGuid(),
            TourId = Guid.NewGuid(),
            TotalPrice = 85000m,
            BookingDate = DateTime.UtcNow
        };

        _publisherMock.Setup(p => p.PublishRequestedAsync(It.IsAny<BookingRequestedIntegrationEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var sut = CreateSut();
        var bookingId = await sut.RequestAsync(dto, CancellationToken.None);

        Assert.NotEqual(Guid.Empty, bookingId);
    }

    // --- Создание бронирования с пустым ClientId выбрасывает исключение ---
    [Fact]
    public async Task RequestAsync_WithEmptyClientId_ThrowsInvalidOperationException()
    {
        var dto = new CreateBookingDto
        {
            ClientId = Guid.Empty,
            TourId = Guid.NewGuid(),
            TotalPrice = 50000m,
            BookingDate = DateTime.UtcNow
        };

        var sut = CreateSut();
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => sut.RequestAsync(dto, CancellationToken.None));

        Assert.Contains("ClientId", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    // --- Создание бронирования с нулевой ценой выбрасывает исключение ---
    [Fact]
    public async Task RequestAsync_WithZeroPrice_ThrowsInvalidOperationException()
    {
        var dto = new CreateBookingDto
        {
            ClientId = Guid.NewGuid(),
            TourId = Guid.NewGuid(),
            TotalPrice = 0m,
            BookingDate = DateTime.UtcNow
        };

        var sut = CreateSut();
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => sut.RequestAsync(dto, CancellationToken.None));

        Assert.Contains("TotalPrice", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    // --- Смена статуса бронирования на "Created" запрещена ---
    [Fact]
    public async Task ChangeStatusAsync_ToCreated_ThrowsInvalidOperationException()
    {
        var dto = new ChangeBookingStatusDto { Status = "Created" };

        var sut = CreateSut();
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => sut.ChangeStatusAsync(Guid.NewGuid(), dto, CancellationToken.None));

        Assert.Contains("Created", exception.Message);
    }

    // --- Смена статуса на "Confirmed" публикует событие ---
    [Fact]
    public async Task ChangeStatusAsync_WithConfirmedStatus_PublishesEvent()
    {
        var bookingId = Guid.NewGuid();
        var dto = new ChangeBookingStatusDto { Status = "Confirmed" };
        BookingStatusChangedIntegrationEvent? publishedEvent = null;

        _publisherMock.Setup(p => p.PublishStatusChangedAsync(It.IsAny<BookingStatusChangedIntegrationEvent>(), It.IsAny<CancellationToken>()))
            .Callback<BookingStatusChangedIntegrationEvent, CancellationToken>((e, _) => publishedEvent = e)
            .Returns(Task.CompletedTask);

        var sut = CreateSut();
        await sut.ChangeStatusAsync(bookingId, dto, CancellationToken.None);

        Assert.NotNull(publishedEvent);
        Assert.Equal(bookingId, publishedEvent!.BookingId);
        Assert.Equal("Confirmed", publishedEvent.Status);
    }
}
