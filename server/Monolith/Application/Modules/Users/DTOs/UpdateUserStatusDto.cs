namespace Application.Modules.Users.DTOs;

public record UpdateUserStatusDto
{
    public bool IsActive { get; init; }
}
