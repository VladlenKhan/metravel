using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Metravel.DTOs.Admin;

namespace Metravel.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly UserManager<IdentityUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;

    public AdminController(UserManager<IdentityUser> userManager, RoleManager<IdentityRole> roleManager)
    {
        _userManager = userManager;
        _roleManager = roleManager;
    }

    [HttpGet("users")]
    public async Task<ActionResult<IEnumerable<UserRoleDto>>> GetUsers()
    {
        var users = await _userManager.Users.ToListAsync();
        var userDtos = new List<UserRoleDto>();

        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            userDtos.Add(new UserRoleDto
            {
                Id = user.Id,
                Email = user.Email ?? string.Empty,
                FullName = user.UserName ?? "Без имени",
                Roles = roles
            });
        }

        return Ok(userDtos);
    }

    [HttpPost("users/{userId}/role")]
    public async Task<IActionResult> AssignRole(string userId, [FromBody] UpdateUserRoleDto dto)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound("Пользователь не найден.");

        if (!await _roleManager.RoleExistsAsync(dto.RoleName))
            return BadRequest("Такой роли не существует.");

        var currentRoles = await _userManager.GetRolesAsync(user);
        await _userManager.RemoveFromRolesAsync(user, currentRoles);
        
        var result = await _userManager.AddToRoleAsync(user, dto.RoleName);

        if (result.Succeeded)
            return Ok(new { message = "Роль успешно обновлена." });

        return BadRequest(result.Errors);
    }
}
