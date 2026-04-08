public record RegisterDto(
    string FullName,
    string Email,
    string PhoneNumber,
    string PassportNumber,
    string Password);

public record LoginDto(
    string Email,
    string Password);

public record AuthResponseDto(
    string Token,
    string FullName,
    string Email,
    string Role);