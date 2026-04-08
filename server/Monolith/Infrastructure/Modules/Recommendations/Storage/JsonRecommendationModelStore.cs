using System.Text.Json;
using Application.Modules.Recommendations.Interfaces;
using Application.Modules.Recommendations.Models;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Modules.Recommendations.Storage;

public class JsonRecommendationModelStore : IRecommendationModelStore
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = true
    };

    private readonly SemaphoreSlim _sync = new(1, 1);
    private readonly ILogger<JsonRecommendationModelStore> _logger;

    public JsonRecommendationModelStore(string modelPath, ILogger<JsonRecommendationModelStore> logger)
    {
        ModelPath = modelPath;
        _logger = logger;
    }

    public string ModelPath { get; }

    public TourRecommendationModel? Current { get; private set; }

    public async Task<TourRecommendationModel?> LoadAsync(CancellationToken cancellationToken = default)
    {
        if (Current is not null)
        {
            return Current;
        }

        await _sync.WaitAsync(cancellationToken);
        try
        {
            if (Current is not null)
            {
                return Current;
            }

            if (!File.Exists(ModelPath))
            {
                _logger.LogInformation("Файл модели рекомендаций пока отсутствует: {ModelPath}", ModelPath);
                return null;
            }

            await using var stream = File.OpenRead(ModelPath);
            Current = await JsonSerializer.DeserializeAsync<TourRecommendationModel>(stream, JsonOptions, cancellationToken);

            if (Current is not null)
            {
                _logger.LogInformation("Модель рекомендаций загружена из файла: {ModelPath}", ModelPath);
            }

            return Current;
        }
        finally
        {
            _sync.Release();
        }
    }

    public async Task SaveAsync(TourRecommendationModel model, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(model);

        await _sync.WaitAsync(cancellationToken);
        try
        {
            var directory = Path.GetDirectoryName(ModelPath);
            if (!string.IsNullOrWhiteSpace(directory))
            {
                Directory.CreateDirectory(directory);
            }

            await using var stream = File.Create(ModelPath);
            await JsonSerializer.SerializeAsync(stream, model, JsonOptions, cancellationToken);
            await stream.FlushAsync(cancellationToken);

            Current = model;
            _logger.LogInformation("Модель рекомендаций сохранена в файл: {ModelPath}", ModelPath);
        }
        finally
        {
            _sync.Release();
        }
    }
}
