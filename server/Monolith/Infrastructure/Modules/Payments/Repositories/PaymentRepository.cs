using Application.Modules.Payments.Interfaces;
using Domain.Payments;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Modules.Payments.Repositories;

public class PaymentRepository : IPaymentRepository
{
    private readonly MeTravelDbContext _dbContext;

    public PaymentRepository(MeTravelDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<Payment?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _dbContext.Payments
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<Payment> AddAsync(Payment payment, CancellationToken cancellationToken = default)
    {
        _dbContext.Payments.Add(payment);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return payment;
    }

    public async Task<Payment?> UpdateAsync(Payment payment, CancellationToken cancellationToken = default)
    {
        var existing = await _dbContext.Payments.FirstOrDefaultAsync(p => p.Id == payment.Id, cancellationToken);
        if (existing is null)
        {
            return null;
        }

        _dbContext.Entry(existing).CurrentValues.SetValues(payment);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return existing;
    }
}
