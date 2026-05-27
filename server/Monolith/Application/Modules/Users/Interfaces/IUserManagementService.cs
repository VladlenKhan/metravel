using Application.Modules.Users.DTOs;

namespace Application.Modules.Users.Interfaces;

public interface IUserManagementService
{
    Task<IReadOnlyList<UserDto>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<UserDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<UserDto?> UpdateRoleAsync(Guid id, UpdateUserRoleDto dto, CancellationToken cancellationToken = default);

    Task<UserDto?> UpdateStatusAsync(Guid id, UpdateUserStatusDto dto, CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
