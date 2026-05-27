using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace BookingService.Infrastructure.Data;

public class BookingDbContextFactory : IDesignTimeDbContextFactory<BookingDbContext>
{
    public BookingDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<BookingDbContext>();
        const string connectionString = "Host=localhost;Port=5432;Database=bookingdb;Username=postgres;Password=postgres";

        optionsBuilder.UseNpgsql(connectionString);

        return new BookingDbContext(optionsBuilder.Options);
    }
}
