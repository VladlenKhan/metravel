using Application.Modules.Audit.Interfaces;
using Application.Modules.Payments.DTOs;
using Application.Modules.Payments.Interfaces;
using Application.Modules.Payments.Services;
using Domain.Payments;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace MeTravel.Tests.Payments;

public class PaymentServiceTests
{
    private readonly Mock<IPaymentRepository> _paymentRepoMock = new();
    private readonly Mock<IAuditService> _auditMock = new();
    private readonly Mock<ILogger<PaymentService>> _loggerMock = new();

    private PaymentService CreateSut() =>
        new(_paymentRepoMock.Object, _auditMock.Object, _loggerMock.Object);

    private static Payment MakePayment(PaymentStatus status = PaymentStatus.Pending) =>
        new()
        {
            Id = Guid.NewGuid(),
            BookingId = Guid.NewGuid(),
            Amount = 45000m,
            Status = status
        };

    // --- Создание платежа возвращает статус Pending ---
    [Fact]
    public async Task CreateAsync_WithValidData_ReturnsPaymentWithPendingStatus()
    {
        var dto = new CreatePaymentDto { BookingId = Guid.NewGuid(), Amount = 45000m };
        var storedPayment = new Payment { Id = Guid.NewGuid(), BookingId = dto.BookingId, Amount = dto.Amount, Status = PaymentStatus.Pending };

        _paymentRepoMock.Setup(r => r.AddAsync(It.IsAny<Payment>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(storedPayment);
        _auditMock.Setup(a => a.WriteAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<bool>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var sut = CreateSut();
        var result = await sut.CreateAsync(dto, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(PaymentStatus.Pending, result.Status);
        Assert.Equal(dto.Amount, result.Amount);
    }

    // --- Оплата уже оплаченного платежа выбрасывает исключение ---
    [Fact]
    public async Task PayAsync_AlreadyPaidPayment_ThrowsInvalidOperationException()
    {
        var payment = MakePayment(PaymentStatus.Paid);
        _paymentRepoMock.Setup(r => r.GetByIdAsync(payment.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(payment);
        _auditMock.Setup(a => a.WriteAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<bool>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var sut = CreateSut();
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => sut.PayAsync(payment.Id, CancellationToken.None));
    }

    // --- Оплата отменённого платежа выбрасывает исключение ---
    [Fact]
    public async Task PayAsync_CancelledPayment_ThrowsInvalidOperationException()
    {
        var payment = MakePayment(PaymentStatus.Cancelled);
        _paymentRepoMock.Setup(r => r.GetByIdAsync(payment.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(payment);
        _auditMock.Setup(a => a.WriteAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<bool>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var sut = CreateSut();
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => sut.PayAsync(payment.Id, CancellationToken.None));
    }

    // --- Отмена ожидающего платежа устанавливает статус Cancelled ---
    [Fact]
    public async Task CancelAsync_PendingPayment_ReturnsPaymentWithCancelledStatus()
    {
        var payment = MakePayment(PaymentStatus.Pending);
        var cancelledPayment = new Payment { Id = payment.Id, BookingId = payment.BookingId, Amount = payment.Amount, Status = PaymentStatus.Cancelled };

        _paymentRepoMock.Setup(r => r.GetByIdAsync(payment.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(payment);
        _paymentRepoMock.Setup(r => r.UpdateAsync(It.IsAny<Payment>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(cancelledPayment);
        _auditMock.Setup(a => a.WriteAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<bool>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var sut = CreateSut();
        var result = await sut.CancelAsync(payment.Id, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(PaymentStatus.Cancelled, result.Status);
    }
}
