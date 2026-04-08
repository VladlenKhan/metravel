using Application.Modules.Audit.Interfaces;
using Application.Modules.Auth.Interfaces;
using Application.Modules.Users.DTOs;
using Application.Modules.Users.Interfaces;
using Domain.Users;
using Microsoft.Extensions.Logging;

namespace Application.Modules.Users.Services;

public class UserManagementService : IUserManagementService
{
    private readonly IUserRepository _userRepository;
    private readonly IAuditService _auditService;
    private readonly ILogger<UserManagementService> _logger;

    public UserManagementService(
        IUserRepository userRepository,
        IAuditService auditService,
        ILogger<UserManagementService> logger)
    {
        _userRepository = userRepository;
        _auditService = auditService;
        _logger = logger;
    }

    public async Task<IReadOnlyList<UserDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var users = await _userRepository.GetAllAsync(cancellationToken);
        return users
            .Select(MapToDto)
            .ToList();
    }

    public async Task<UserDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(id, cancellationToken);
        if (user is null)
        {
            return null;
        }

        return MapToDto(user);
    }

    public async Task<UserDto?> UpdateRoleAsync(Guid id, UpdateUserRoleDto dto, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(id, cancellationToken);
        if (user is null)
        {
            await WriteNotFoundAuditAsync("UpdateRole", id, cancellationToken);
            return null;
        }

        var normalizedRole = dto.Role.Trim();
        if (!Enum.TryParse<UserRole>(normalizedRole, true, out var role))
        {
            throw new InvalidOperationException("Unsupported role.");
        }

        user.Role = role;

        var updated = await _userRepository.UpdateAsync(user, cancellationToken);
        if (updated is null)
        {
            return null;
        }

        _logger.LogInformation("User role updated. Id={UserId}, Role={Role}", updated.Id, updated.Role);

        await _auditService.WriteAsync(
            action: "UpdateRole",
            entityType: "User",
            entityId: updated.Id.ToString(),
            success: true,
            details: $"User role updated to {updated.Role}",
            cancellationToken: cancellationToken);

        return MapToDto(updated);
    }

    public async Task<UserDto?> UpdateStatusAsync(Guid id, UpdateUserStatusDto dto, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(id, cancellationToken);
        if (user is null)
        {
            await WriteNotFoundAuditAsync("UpdateStatus", id, cancellationToken);
            return null;
        }

        user.IsActive = dto.IsActive;

        var updated = await _userRepository.UpdateAsync(user, cancellationToken);
        if (updated is null)
        {
            return null;
        }

        _logger.LogInformation("User status updated. Id={UserId}, IsActive={IsActive}", updated.Id, updated.IsActive);

        await _auditService.WriteAsync(
            action: "UpdateStatus",
            entityType: "User",
            entityId: updated.Id.ToString(),
            success: true,
            details: $"User active status changed to {updated.IsActive}",
            cancellationToken: cancellationToken);

        return MapToDto(updated);
    }

    private async Task WriteNotFoundAuditAsync(string action, Guid userId, CancellationToken cancellationToken)
    {
        _logger.LogWarning("User not found during {Action}. Id={UserId}", action, userId);

        await _auditService.WriteAsync(
            action: action,
            entityType: "User",
            entityId: userId.ToString(),
            success: false,
            details: "User not found",
            cancellationToken: cancellationToken);
    }

    private static UserDto MapToDto(User user)
    {
        return new UserDto(
            user.Id,
            user.FullName,
            user.Email,
            user.Role.ToString(),
            user.IsActive,
            user.ClientId);
    }
}
