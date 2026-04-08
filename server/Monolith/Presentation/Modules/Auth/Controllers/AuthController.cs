using System.Security.Claims;
using Application.Modules.Auth.DTO;
using Application.Modules.Auth.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Modules.Auth.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IUserRepository _userRepository;

    public AuthController(IAuthService authService, IUserRepository userRepository)
    {
        _authService = authService;
        _userRepository = userRepository;
    }

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _authService.RegisterAsync(dto, cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _authService.LoginAsync(dto, cancellationToken);
            return Ok(result);
        }
        catch (UnauthorizedAccessException exception)
        {
            return Unauthorized(new { message = exception.Message });
        }
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me (CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user is null)
        {
            return NotFound();
        }

        return Ok(new
        {
            user.Id,
            user.FullName,
            user.Email,
            Role = user.Role.ToString(),
            user.ClientId
        });
    }
}
