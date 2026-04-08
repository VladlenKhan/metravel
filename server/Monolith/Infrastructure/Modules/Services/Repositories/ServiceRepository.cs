using Application.Modules.Services.Interfaces;
using Domain.Services;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Modules.Services.Repositories;

public class ServiceRepository : IServiceRepository
{
    private readonly MeTravelDbContext _dbContext;

    public ServiceRepository(MeTravelDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<Service>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.Services
            .AsNoTracking()
            .OrderBy(s => s.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<Service?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Services
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task<Service> AddAsync(Service service, CancellationToken cancellationToken = default)
    {
        _dbContext.Services.Add(service);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return service;
    }

    public async Task<Service?> UpdateAsync(Service service, CancellationToken cancellationToken = default)
    {
        var existing = await _dbContext.Services.FirstOrDefaultAsync(s => s.Id == service.Id, cancellationToken);
        if (existing is null)
        {
            return null;
        }

        _dbContext.Entry(existing).CurrentValues.SetValues(service);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return existing;
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var existing = await _dbContext.Services.FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
        if (existing is null)
        {
            return false;
        }

        _dbContext.Services.Remove(existing);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}
