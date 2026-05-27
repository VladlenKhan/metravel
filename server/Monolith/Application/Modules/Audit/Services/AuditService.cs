using Application.Modules.Audit.Interfaces;
using Domain.Audit;

namespace Application.Modules.Audit.Services;

public class AuditService : IAuditService
{
    private readonly IAuditRepository _auditRepository;

    public AuditService(IAuditRepository auditRepository)
    {
        _auditRepository = auditRepository;
    }

    public async Task WriteAsync(
        string action,
        string entityType,
        string? entityId,
        bool success,
        string? details = null,
        string? userName = null,
        CancellationToken cancellationToken = default)
    {
        var entry = new AuditLog
        {
            Id = Guid.NewGuid(),
            Timestamp = DateTime.UtcNow,
            UserName = userName,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            Success = success,
            Details = details
        };

        await _auditRepository.AddAsync(entry, cancellationToken);
    }
}

