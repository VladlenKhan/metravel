namespace Application.Modules.Services.DTOs;

public class ServiceDto
{
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public decimal? Price { get; set; }
}
