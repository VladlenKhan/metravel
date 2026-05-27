using Domain.Clients;

namespace Application.Modules.Clients.Interfaces;

public interface IClientRepository
{
    Task<IReadOnlyList<Client>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<Client?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<bool> ExistsByEmailAsync(string email, Guid? excludeId = null, CancellationToken cancellationToken = default);

    Task<bool> ExistsByPassportNumberAsync(string passportNumber, Guid? excludeId = null, CancellationToken cancellationToken = default);

    Task<Client> AddAsync(Client client, CancellationToken cancellationToken = default);

    Task<Client?> UpdateAsync(Client client, CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
