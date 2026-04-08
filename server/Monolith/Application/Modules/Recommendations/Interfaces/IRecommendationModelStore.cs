using Application.Modules.Recommendations.Models;

namespace Application.Modules.Recommendations.Interfaces;

public interface IRecommendationModelStore
{
    string ModelPath { get; }

    TourRecommendationModel? Current { get; }

    Task<TourRecommendationModel?> LoadAsync(CancellationToken cancellationToken = default);

    Task SaveAsync(TourRecommendationModel model, CancellationToken cancellationToken = default);
}
