using Application.Modules.Tours.Interfaces;
using Domain.Tours;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Modules.Tours.Repositories;

public class TourRepository : ITourRepository
{
    private readonly MeTravelDbContext _dbContext;

    public TourRepository(MeTravelDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<Tour>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.Tours.AsNoTracking().ToListAsync(cancellationToken);
    }

    public async Task<Tour?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Tours.AsNoTracking().FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
    }

    public async Task<Tour> AddAsync(Tour tour, CancellationToken cancellationToken = default)
    {
        _dbContext.Tours.Add(tour);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return tour;
    }

    public async Task<Tour?> UpdateAsync(Tour tour, CancellationToken cancellationToken = default)
    {
        var existing = await _dbContext.Tours.FirstOrDefaultAsync(t => t.Id == tour.Id, cancellationToken);
        if (existing is null)
        {
            return null;
        }

        _dbContext.Entry(existing).CurrentValues.SetValues(tour);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return existing;
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var existing = await _dbContext.Tours.FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
        if (existing is null)
        {
            return false;
        }

        _dbContext.Tours.Remove(existing);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}
