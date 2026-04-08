using System.ComponentModel.DataAnnotations;

namespace Application.Modules.Auth.DTO;

public record RegisterDto
{
    [Required]
    [StringLength(200, MinimumLength = 2)]
    public string FullName { get; init; } = null!;

    [Required]
    [EmailAddress]
    [StringLength(200)]
    public string Email { get; init; } = null!;

    [Required]
    [StringLength(50, MinimumLength = 6)]
    public string PhoneNumber { get; init; } = null!;

    [Required]
    [StringLength(50, MinimumLength = 5)]
    public string PassportNumber { get; init; } = null!;

    [Required]
    [MinLength(6)]
    public string Password { get; init; } = null!;
}

public record LoginDto
{
    [Required]
    [EmailAddress]
    [StringLength(200)]
    public string Email { get; init; } = null!;

    [Required]
    [MinLength(6)]
    public string Password { get; init; } = null!;
}

public record AuthResponseDto(
    string Token,
    string FullName,
    string Email,
    string Role);
