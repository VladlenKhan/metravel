namespace Application.Modules.Audit.Interfaces;

public interface IAuditService
{
    Task WriteAsync(
        string action,
        string entityType,
        string? entityId,
        bool success,
        string? details = null,
        string? userName = null,
        CancellationToken cancellationToken = default);
}

