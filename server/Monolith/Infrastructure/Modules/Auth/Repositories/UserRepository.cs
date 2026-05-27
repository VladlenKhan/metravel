using Application.Modules.Auth.Interfaces;
using Domain.Clients;
using Domain.Users;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Modules.Auth.Repositories;

public class UserRepository : IUserRepository
{
    private readonly MeTravelDbContext _dbContext;

    public UserRepository(MeTravelDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Users
            .AsNoTracking()
            .AnyAsync(u => u.Email == email, cancellationToken);
    }

    public async Task<IReadOnlyList<User>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.Users
            .AsNoTracking()
            .Include(u => u.Client)
            .OrderBy(u => u.FullName)
            .ToListAsync(cancellationToken);
    }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Users
            .AsNoTracking()
            .Include(u => u.Client)
            .FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
    }

    public async Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Users
            .AsNoTracking()
            .Include(u => u.Client)
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
    }

    public async Task<User> CreateWithClientAsync(User user, Client client, CancellationToken cancellationToken = default)
    {
        _dbContext.Clients.Add(client);
        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return user;
    }

    public async Task<User> AddAsync(User user, CancellationToken cancellationToken = default)
    {
        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return user;
    }

    public async Task<User?> UpdateAsync(User user, CancellationToken cancellationToken = default)
    {
        var existing = await _dbContext.Users
            .Include(u => u.Client)
            .FirstOrDefaultAsync(u => u.Id == user.Id, cancellationToken);

        if (existing is null)
        {
            return null;
        }

        existing.FullName = user.FullName;
        existing.Email = user.Email;
        existing.PasswordHash = user.PasswordHash;
        existing.Role = user.Role;
        existing.IsActive = user.IsActive;
        existing.ClientId = user.ClientId;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return existing;
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var existing = await _dbContext.Users
            .Include(u => u.Client)
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);

        if (existing is null)
        {
            return false;
        }

        var linkedClient = existing.Client;

        _dbContext.Users.Remove(existing);

        if (linkedClient is not null)
        {
            _dbContext.Clients.Remove(linkedClient);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
