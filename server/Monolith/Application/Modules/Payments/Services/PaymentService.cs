using Application.Modules.Audit.Interfaces;
using Application.Modules.Payments.DTOs;
using Application.Modules.Payments.Interfaces;
using Domain.Payments;
using Microsoft.Extensions.Logging;

namespace Application.Modules.Payments.Services;

public class PaymentService : IPaymentService
{
    private readonly IPaymentRepository _paymentRepository;
    private readonly IAuditService _auditService;
    private readonly ILogger<PaymentService> _logger;

    public PaymentService(
        IPaymentRepository paymentRepository,
        IAuditService auditService,
        ILogger<PaymentService> logger)
    {
        _paymentRepository = paymentRepository;
        _auditService = auditService;
        _logger = logger;
    }

    public async Task<PaymentDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var payment = await _paymentRepository.GetByIdAsync(id, cancellationToken);
        if (payment is null)
        {
            return null;
        }

        return MapToDto(payment);
    }

    public async Task<PaymentDto?> PayAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var payment = await _paymentRepository.GetByIdAsync(id, cancellationToken);
        if (payment is null)
        {
            _logger.LogWarning("Попытка оплатить несуществующую оплату. Id={PaymentId}", id);
            await _auditService.WriteAsync(
                action: "Pay",
                entityType: "Payment",
                entityId: id.ToString(),
                success: false,
                details: "Оплата не найдена",
                cancellationToken: cancellationToken);
            return null;
        }

        EnsurePending(payment, "оплатить");

        payment.Status = PaymentStatus.Paid;
        var updated = await _paymentRepository.UpdateAsync(payment, cancellationToken);
        if (updated is null)
        {
            return null;
        }

        _logger.LogInformation("Оплата проведена. Id={PaymentId}, BookingId={BookingId}", updated.Id, updated.BookingId);
        await _auditService.WriteAsync(
            action: "Pay",
            entityType: "Payment",
            entityId: updated.Id.ToString(),
            success: true,
            details: "Оплата успешно проведена",
            cancellationToken: cancellationToken);

        return MapToDto(updated);
    }

    public async Task<PaymentDto> CreateAsync(CreatePaymentDto dto, CancellationToken cancellationToken = default)
    {
        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            BookingId = dto.BookingId,
            Amount = dto.Amount,
            Status = PaymentStatus.Pending
        };

        var created = await _paymentRepository.AddAsync(payment, cancellationToken);
        _logger.LogInformation("Оплата создана. Id={PaymentId}, BookingId={BookingId}, Amount={Amount}", created.Id, created.BookingId, created.Amount);
        await _auditService.WriteAsync(
            action: "Create",
            entityType: "Payment",
            entityId: created.Id.ToString(),
            success: true,
            details: $"Создана оплата для брони {created.BookingId}",
            cancellationToken: cancellationToken);

        return MapToDto(created);
    }

    public async Task<PaymentDto?> CancelAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var payment = await _paymentRepository.GetByIdAsync(id, cancellationToken);
        if (payment is null)
        {
            _logger.LogWarning("Попытка отменить несуществующую оплату. Id={PaymentId}", id);
            await _auditService.WriteAsync(
                action: "Cancel",
                entityType: "Payment",
                entityId: id.ToString(),
                success: false,
                details: "Оплата не найдена",
                cancellationToken: cancellationToken);
            return null;
        }

        EnsurePending(payment, "отменить");

        payment.Status = PaymentStatus.Cancelled;
        var updated = await _paymentRepository.UpdateAsync(payment, cancellationToken);
        if (updated is null)
        {
            return null;
        }

        _logger.LogInformation("Оплата отменена. Id={PaymentId}, BookingId={BookingId}", updated.Id, updated.BookingId);
        await _auditService.WriteAsync(
            action: "Cancel",
            entityType: "Payment",
            entityId: updated.Id.ToString(),
            success: true,
            details: "Оплата отменена",
            cancellationToken: cancellationToken);

        return MapToDto(updated);
    }

    private static PaymentDto MapToDto(Payment payment)
    {
        return new PaymentDto
        {
            Id = payment.Id,
            BookingId = payment.BookingId,
            Amount = payment.Amount,
            Status = payment.Status
        };
    }

    private static void EnsurePending(Payment payment, string operation)
    {
        if (payment.Status != PaymentStatus.Pending)
        {
            throw new InvalidOperationException($"Нельзя {operation} оплату со статусом {payment.Status}.");
        }
    }
}
