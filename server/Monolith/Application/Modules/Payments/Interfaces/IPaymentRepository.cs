using Domain.Payments;

namespace Application.Modules.Payments.Interfaces;

public interface IPaymentRepository
{
    Task<Payment?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<Payment> AddAsync(Payment payment, CancellationToken cancellationToken = default);

    Task<Payment?> UpdateAsync(Payment payment, CancellationToken cancellationToken = default);
}
