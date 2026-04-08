using Application.Modules.Clients.Interfaces;
using Domain.Clients;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Modules.Clients.Repositories;

public class ClientRepository : IClientRepository
{
    private readonly MeTravelDbContext _dbContext;

    public ClientRepository(MeTravelDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<Client>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.Clients
            .AsNoTracking()
            .OrderBy(c => c.FullName)
            .ToListAsync(cancellationToken);
    }

    public async Task<Client?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Clients
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<bool> ExistsByEmailAsync(string email, Guid? excludeId = null, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Clients
            .AsNoTracking()
            .Where(c => c.Email == email);

        if (excludeId.HasValue)
        {
            query = query.Where(c => c.Id != excludeId.Value);
        }

        return await query.AnyAsync(cancellationToken);
    }

    public async Task<bool> ExistsByPassportNumberAsync(string passportNumber, Guid? excludeId = null, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Clients
            .AsNoTracking()
            .Where(c => c.PassportNumber == passportNumber);

        if (excludeId.HasValue)
        {
            query = query.Where(c => c.Id != excludeId.Value);
        }

        return await query.AnyAsync(cancellationToken);
    }

    public async Task<Client> AddAsync(Client client, CancellationToken cancellationToken = default)
    {
        _dbContext.Clients.Add(client);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return client;
    }

    public async Task<Client?> UpdateAsync(Client client, CancellationToken cancellationToken = default)
    {
        var existing = await _dbContext.Clients.FirstOrDefaultAsync(c => c.Id == client.Id, cancellationToken);
        if (existing is null)
        {
            return null;
        }

        _dbContext.Entry(existing).CurrentValues.SetValues(client);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return existing;
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var existing = await _dbContext.Clients.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (existing is null)
        {
            return false;
        }

        _dbContext.Clients.Remove(existing);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}
