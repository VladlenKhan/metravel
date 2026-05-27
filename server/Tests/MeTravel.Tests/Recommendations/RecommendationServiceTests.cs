using Application.Modules.Audit.Interfaces;
using Application.Modules.Recommendations.DTOs;
using Application.Modules.Recommendations.Interfaces;
using Application.Modules.Recommendations.Services;
using Application.Modules.Tours.Interfaces;
using Domain.Tours;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace MeTravel.Tests.Recommendations;

public class RecommendationServiceTests
{
    private readonly Mock<ITourRepository> _tourRepoMock = new();
    private readonly Mock<IRecommendationModelStore> _modelStoreMock = new();
    private readonly Mock<IAuditService> _auditMock = new();
    private readonly Mock<ILogger<RecommendationService>> _loggerMock = new();

    private RecommendationService CreateSut() =>
        new(_tourRepoMock.Object, _modelStoreMock.Object, _auditMock.Object, _loggerMock.Object);

    // --- Запрос рекомендаций без параметров выбрасывает ArgumentException ---
    [Fact]
    public async Task RecommendAsync_WithAllEmptyParams_ThrowsArgumentException()
    {
        var request = new TourRecommendationRequestDto
        {
            Country = null,
            City = null,
            Budget = null,
            DesiredDurationDays = null,
            PreferredMonth = null,
            Top = 5
        };

        var sut = CreateSut();
        var exception = await Assert.ThrowsAsync<ArgumentException>(
            () => sut.RecommendAsync(request, CancellationToken.None));

        Assert.Contains("параметр", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    // --- Запрос рекомендаций с недопустимым месяцем выбрасывает ArgumentException ---
    [Fact]
    public async Task RecommendAsync_WithInvalidMonth_ThrowsArgumentException()
    {
        var request = new TourRecommendationRequestDto
        {
            Country = "Россия",
            PreferredMonth = 13,
            Top = 5
        };

        var sut = CreateSut();
        var exception = await Assert.ThrowsAsync<ArgumentException>(
            () => sut.RecommendAsync(request, CancellationToken.None));

        Assert.Contains("Месяц", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    // --- Обучение модели без туров выбрасывает InvalidOperationException ---
    [Fact]
    public async Task TrainAsync_WithNoTours_ThrowsInvalidOperationException()
    {
        _tourRepoMock.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Tour>());

        var sut = CreateSut();
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => sut.TrainAsync(CancellationToken.None));

        Assert.Contains("данных", exception.Message, StringComparison.OrdinalIgnoreCase);
    }
}
