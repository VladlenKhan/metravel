using Application.Modules.Clients.DTOs;

namespace Application.Modules.Clients.Interfaces;

public interface IClientService
{
    Task<IReadOnlyList<ClientDto>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<ClientDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<ClientDto> CreateAsync(ClientDto dto, CancellationToken cancellationToken = default);

    Task<ClientDto?> UpdateAsync(Guid id, ClientDto dto, CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
