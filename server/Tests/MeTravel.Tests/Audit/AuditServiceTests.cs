using Application.Modules.Audit.Interfaces;
using Application.Modules.Audit.Services;
using Domain.Audit;
using Moq;
using Xunit;

namespace MeTravel.Tests.Audit;

public class AuditServiceTests
{
    private readonly Mock<IAuditRepository> _auditRepoMock = new();

    private AuditService CreateSut() => new(_auditRepoMock.Object);

    // --- Запись аудита вызывает AddAsync ровно один раз ---
    [Fact]
    public async Task WriteAsync_WithValidData_CallsRepositoryOnce()
    {
        _auditRepoMock.Setup(r => r.AddAsync(It.IsAny<AuditLog>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var sut = CreateSut();
        await sut.WriteAsync(
            action: "Login",
            entityType: "User",
            entityId: Guid.NewGuid().ToString(),
            success: true,
            cancellationToken: CancellationToken.None);

        _auditRepoMock.Verify(
            r => r.AddAsync(It.IsAny<AuditLog>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    // --- Запись аудита сохраняет корректный флаг успеха ---
    [Fact]
    public async Task WriteAsync_FailedAction_SavesSuccessFalse()
    {
        AuditLog? savedLog = null;

        _auditRepoMock.Setup(r => r.AddAsync(It.IsAny<AuditLog>(), It.IsAny<CancellationToken>()))
            .Callback<AuditLog, CancellationToken>((log, _) => savedLog = log)
            .Returns(Task.CompletedTask);

        var sut = CreateSut();
        await sut.WriteAsync(
            action: "Payment",
            entityType: "Payment",
            entityId: "123",
            success: false,
            details: "Недостаточно средств",
            cancellationToken: CancellationToken.None);

        Assert.NotNull(savedLog);
        Assert.False(savedLog!.Success);
        Assert.Equal("Недостаточно средств", savedLog.Details);
    }
}
