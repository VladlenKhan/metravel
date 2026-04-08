using Application.Modules.Audit.Interfaces;
using Domain.Audit;

namespace Infrastructure.Modules.Audit.Repositories;

public class AuditRepository : IAuditRepository
{
    private readonly MeTravelDbContext _dbContext;

    public AuditRepository(MeTravelDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(AuditLog auditLog, CancellationToken cancellationToken = default)
    {
        _dbContext.AuditLogs.Add(auditLog);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}

