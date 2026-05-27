using Application.Modules.Auth.DTO;
using Application.Modules.Auth.Interfaces;
using Application.Modules.Clients.Interfaces;
using Domain.Clients;
using Domain.Users;

namespace Application.Modules.Auth.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IClientRepository _clientRepository;
    private readonly IPasswordHasherService _passwordHasherService;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public AuthService(
        IUserRepository userRepository,
        IClientRepository clientRepository,
        IPasswordHasherService passwordHasherService,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _userRepository = userRepository;
        _clientRepository = clientRepository;
        _passwordHasherService = passwordHasherService;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = NormalizeEmail(dto.Email);
        var normalizedPassportNumber = NormalizePassportNumber(dto.PassportNumber);

        await ValidateRegistrationAsync(normalizedEmail, normalizedPassportNumber, cancellationToken);

        var client = CreateClient(dto, normalizedEmail, normalizedPassportNumber);
        var user = CreateClientUser(dto, normalizedEmail, client.Id);

        user.PasswordHash = _passwordHasherService.HashPassword(user, dto.Password);

        var createdUser = await _userRepository.CreateWithClientAsync(user, client, cancellationToken);
        return BuildAuthResponse(createdUser);
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = NormalizeEmail(dto.Email);
        var user = await _userRepository.GetByEmailAsync(normalizedEmail, cancellationToken);
        if (user is null || !user.IsActive)
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        var passwordIsValid = _passwordHasherService.VerifyPassword(user, dto.Password);
        if (!passwordIsValid)
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        return BuildAuthResponse(user);
    }

    private static string NormalizeEmail(string email)
    {
        return email.Trim().ToLowerInvariant();
    }

    private static string NormalizePassportNumber(string passportNumber)
    {
        return passportNumber.Trim().ToUpperInvariant();
    }

    private async Task ValidateRegistrationAsync(
        string normalizedEmail,
        string normalizedPassportNumber,
        CancellationToken cancellationToken)
    {
        var userExists = await _userRepository.ExistsByEmailAsync(normalizedEmail, cancellationToken);
        if (userExists)
        {
            throw new InvalidOperationException("User with this email already exists.");
        }

        var clientEmailExists = await _clientRepository.ExistsByEmailAsync(normalizedEmail, null, cancellationToken);
        if (clientEmailExists)
        {
            throw new InvalidOperationException("Client with this email already exists.");
        }

        var clientExists = await _clientRepository.ExistsByPassportNumberAsync(
            normalizedPassportNumber,
            null,
            cancellationToken);

        if (clientExists)
        {
            throw new InvalidOperationException("Client with this passport number already exists.");
        }
    }

    private static Client CreateClient(
        RegisterDto dto,
        string normalizedEmail,
        string normalizedPassportNumber)
    {
        return new Client
        {
            Id = Guid.NewGuid(),
            FullName = dto.FullName.Trim(),
            PhoneNumber = dto.PhoneNumber.Trim(),
            PassportNumber = normalizedPassportNumber,
            IsRegular = false,
            Email = normalizedEmail
        };
    }

    private static User CreateClientUser(RegisterDto dto, string normalizedEmail, Guid clientId)
    {
        return new User
        {
            Id = Guid.NewGuid(),
            FullName = dto.FullName.Trim(),
            Email = normalizedEmail,
            Role = UserRole.Client,
            IsActive = true,
            ClientId = clientId
        };
    }

    private AuthResponseDto BuildAuthResponse(User user)
    {
        var token = _jwtTokenGenerator.GenerateToken(user);

        return new AuthResponseDto(
            token,
            user.FullName,
            user.Email,
            user.Role.ToString());
    }
}
