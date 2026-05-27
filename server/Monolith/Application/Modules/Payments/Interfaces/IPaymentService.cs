using Application.Modules.Payments.DTOs;

namespace Application.Modules.Payments.Interfaces;

public interface IPaymentService
{
    Task<PaymentDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<PaymentDto> CreateAsync(CreatePaymentDto dto, CancellationToken cancellationToken = default);

    Task<PaymentDto?> PayAsync(Guid id, CancellationToken cancellationToken = default);

    Task<PaymentDto?> CancelAsync(Guid id, CancellationToken cancellationToken = default);
}
