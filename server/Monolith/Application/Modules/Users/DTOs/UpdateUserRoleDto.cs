using System.ComponentModel.DataAnnotations;

namespace Application.Modules.Users.DTOs;

public record UpdateUserRoleDto
{
    [Required]
    public string Role { get; init; } = null!;
}
