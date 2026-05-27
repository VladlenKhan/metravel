using Application.Modules.Clients.DTOs;
using Application.Modules.Clients.Interfaces;
using Application.Modules.Clients.Services;
using Domain.Clients;
using Moq;
using Xunit;

namespace MeTravel.Tests.Clients;

public class ClientServiceTests
{
    private readonly Mock<IClientRepository> _clientRepoMock = new();

    private ClientService CreateSut() => new(_clientRepoMock.Object);

    // --- Получение несуществующего клиента возвращает null ---
    [Fact]
    public async Task GetByIdAsync_NonExistentId_ReturnsNull()
    {
        _clientRepoMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Client?)null);

        var sut = CreateSut();
        var result = await sut.GetByIdAsync(Guid.NewGuid(), CancellationToken.None);

        Assert.Null(result);
    }

    // --- Создание клиента с уже существующим email выбрасывает исключение ---
    [Fact]
    public async Task CreateAsync_WithDuplicateEmail_ThrowsInvalidOperationException()
    {
        var dto = new ClientDto
        {
            FullName = "Анна Сидорова",
            Email = "anna@example.com",
            PhoneNumber = "+79001112233",
            PassportNumber = "CD456789",
            IsRegular = false
        };

        _clientRepoMock.Setup(r => r.ExistsByEmailAsync(dto.Email, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var sut = CreateSut();
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => sut.CreateAsync(dto, CancellationToken.None));

        Assert.Contains("email", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    // --- Обновление несуществующего клиента возвращает null ---
    [Fact]
    public async Task UpdateAsync_NonExistentId_ReturnsNull()
    {
        var dto = new ClientDto
        {
            FullName = "Обновлённое Имя",
            Email = "update@example.com",
            PhoneNumber = "+79009998877",
            PassportNumber = "EF111222",
            IsRegular = true
        };

        _clientRepoMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Client?)null);

        var sut = CreateSut();
        var result = await sut.UpdateAsync(Guid.NewGuid(), dto, CancellationToken.None);

        Assert.Null(result);
    }
}
