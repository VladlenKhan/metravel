namespace Application.Modules.Users.DTOs;

public record UserDto(
    Guid Id,
    string FullName,
    string Email,
    string Role,
    bool IsActive,
    Guid? ClientId);
