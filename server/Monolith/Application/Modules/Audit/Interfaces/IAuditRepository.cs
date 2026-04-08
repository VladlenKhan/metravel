using Domain.Audit;

namespace Application.Modules.Audit.Interfaces;

public interface IAuditRepository
{
    Task AddAsync(AuditLog auditLog, CancellationToken cancellationToken = default);
}

