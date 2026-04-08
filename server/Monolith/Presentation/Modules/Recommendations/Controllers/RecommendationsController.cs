using Application.Modules.Auth.Authorization;
using Application.Modules.Recommendations.DTOs;
using Application.Modules.Recommendations.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Modules.Recommendations.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RecommendationsController : ControllerBase
{
    private readonly IRecommendationService _recommendationService;

    public RecommendationsController(IRecommendationService recommendationService)
    {
        _recommendationService = recommendationService;
    }

    [HttpGet("model")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<ActionResult<RecommendationTrainingResultDto>> GetModelInfo(CancellationToken cancellationToken)
    {
        var result = await _recommendationService.GetModelInfoAsync(cancellationToken);
        if (result is null)
        {
            return NotFound(new { message = "Модель рекомендаций ещё не обучена." });
        }

        return Ok(result);
    }

    [HttpPost("train")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<ActionResult<RecommendationTrainingResultDto>> Train(CancellationToken cancellationToken)
    {
        try
        {
            var result = await _recommendationService.TrainAsync(cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPost("predict")]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<TourRecommendationDto>>> Predict(
        [FromBody] TourRecommendationRequestDto request,
        CancellationToken cancellationToken)
    {
        try
        {
            var recommendations = await _recommendationService.RecommendAsync(request, cancellationToken);
            return Ok(recommendations);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }
}
