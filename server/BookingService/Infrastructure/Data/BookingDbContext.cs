using BookingService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BookingService.Infrastructure.Data;

public class BookingDbContext : DbContext
{
    public BookingDbContext(DbContextOptions<BookingDbContext> options) : base(options)
    {
    }

    public DbSet<Booking> Bookings { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Booking>()
            .HasKey(b => b.Id);

        modelBuilder.Entity<Booking>()
            .Property(b => b.ClientId)
            .IsRequired();

        modelBuilder.Entity<Booking>()
            .Property(b => b.TourId)
            .IsRequired();

        modelBuilder.Entity<Booking>()
            .Property(b => b.BookingDate)
            .IsRequired();

        modelBuilder.Entity<Booking>()
            .Property(b => b.TotalPrice)
            .HasColumnType("numeric(18,2)");

        modelBuilder.Entity<Booking>()
            .Property(b => b.Status)
            .HasConversion<int>();
    }
}
