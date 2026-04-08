namespace Domain.Audit;

public class AuditLog
{
    public Guid Id { get; set; }

    public DateTime Timestamp { get; set; }

    public string? UserName { get; set; }

    public string Action { get; set; } = null!;

    public string EntityType { get; set; } = null!;

    public string? EntityId { get; set; }

    public bool Success { get; set; }

    public string? Details { get; set; }
}

