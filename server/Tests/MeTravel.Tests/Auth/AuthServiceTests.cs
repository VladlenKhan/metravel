using Application.Modules.Auth.DTO;
using Application.Modules.Auth.Interfaces;
using Application.Modules.Auth.Services;
using Application.Modules.Clients.Interfaces;
using Domain.Clients;
using Domain.Users;
using Moq;
using Xunit;

namespace MeTravel.Tests.Auth;

public class AuthServiceTests
{
    private readonly Mock<IUserRepository> _userRepoMock = new();
    private readonly Mock<IClientRepository> _clientRepoMock = new();
    private readonly Mock<IPasswordHasherService> _hasherMock = new();
    private readonly Mock<IJwtTokenGenerator> _jwtMock = new();

    private AuthService CreateSut() =>
        new(_userRepoMock.Object, _clientRepoMock.Object, _hasherMock.Object, _jwtMock.Object);

    // --- Регистрация с корректными данными возвращает токен ---
    [Fact]
    public async Task RegisterAsync_WithValidData_ReturnsTokenAndUserInfo()
    {
        var dto = new RegisterDto("Иван Иванов", "ivan@example.com", "+79001234567", "AB123456", "SecurePass1!");

        _userRepoMock.Setup(r => r.ExistsByEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _clientRepoMock.Setup(r => r.ExistsByEmailAsync(It.IsAny<string>(), null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _clientRepoMock.Setup(r => r.ExistsByPassportNumberAsync(It.IsAny<string>(), null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _hasherMock.Setup(h => h.HashPassword(It.IsAny<User>(), It.IsAny<string>()))
            .Returns("hashed_password");

        var createdUser = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Иван Иванов",
            Email = "ivan@example.com",
            Role = UserRole.Client,
            IsActive = true,
            ClientId = Guid.NewGuid(),
            PasswordHash = "hashed_password"
        };

        _userRepoMock.Setup(r => r.CreateWithClientAsync(It.IsAny<User>(), It.IsAny<Client>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(createdUser);
        _jwtMock.Setup(j => j.GenerateToken(It.IsAny<User>())).Returns("jwt_token");

        var sut = CreateSut();
        var result = await sut.RegisterAsync(dto, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("jwt_token", result.Token);
        Assert.Equal("Иван Иванов", result.FullName);
        Assert.Equal("ivan@example.com", result.Email);
        Assert.Equal("Client", result.Role);
    }

    // --- Регистрация с уже существующим email выбрасывает исключение ---
    [Fact]
    public async Task RegisterAsync_WithExistingEmail_ThrowsInvalidOperationException()
    {
        var dto = new RegisterDto("Мария Петрова", "existing@example.com", "+79000000001", "XY999999", "Pass123!");

        _userRepoMock.Setup(r => r.ExistsByEmailAsync("existing@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var sut = CreateSut();
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => sut.RegisterAsync(dto, CancellationToken.None));

        Assert.Contains("email", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    // --- Вход с корректными данными возвращает токен ---
    [Fact]
    public async Task LoginAsync_WithValidCredentials_ReturnsAuthResponse()
    {
        var dto = new LoginDto("user@example.com", "correct_password");
        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Пользователь Тест",
            Email = "user@example.com",
            Role = UserRole.Client,
            IsActive = true,
            PasswordHash = "hash"
        };

        _userRepoMock.Setup(r => r.GetByEmailAsync("user@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _hasherMock.Setup(h => h.VerifyPassword(user, "correct_password")).Returns(true);
        _jwtMock.Setup(j => j.GenerateToken(user)).Returns("valid_jwt");

        var sut = CreateSut();
        var result = await sut.LoginAsync(dto, CancellationToken.None);

        Assert.Equal("valid_jwt", result.Token);
        Assert.Equal("user@example.com", result.Email);
    }

    // --- Вход с неверным паролем выбрасывает UnauthorizedAccessException ---
    [Fact]
    public async Task LoginAsync_WithWrongPassword_ThrowsUnauthorizedAccessException()
    {
        var dto = new LoginDto("user@example.com", "wrong_password");
        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Пользователь",
            Email = "user@example.com",
            Role = UserRole.Client,
            IsActive = true,
            PasswordHash = "hash"
        };

        _userRepoMock.Setup(r => r.GetByEmailAsync("user@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _hasherMock.Setup(h => h.VerifyPassword(user, "wrong_password")).Returns(false);

        var sut = CreateSut();
        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => sut.LoginAsync(dto, CancellationToken.None));
    }

    // --- Вход заблокированного пользователя выбрасывает UnauthorizedAccessException ---
    [Fact]
    public async Task LoginAsync_WithInactiveUser_ThrowsUnauthorizedAccessException()
    {
        var dto = new LoginDto("blocked@example.com", "somepass");
        var inactiveUser = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Заблокированный",
            Email = "blocked@example.com",
            Role = UserRole.Client,
            IsActive = false,
            PasswordHash = "hash"
        };

        _userRepoMock.Setup(r => r.GetByEmailAsync("blocked@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(inactiveUser);

        var sut = CreateSut();
        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => sut.LoginAsync(dto, CancellationToken.None));
    }
}
