using Domain.Bookings;
using Domain.Clients;
using Domain.Services;
using Domain.Tours;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure;

public class MeTravelDbContext : DbContext
{
    public MeTravelDbContext(DbContextOptions<MeTravelDbContext> options) : base(options)
    {
    }

    public DbSet<Client> Clients { get; set; } = null!;
    public DbSet<Tour> Tours { get; set; } = null!;
    public DbSet<Booking> Bookings { get; set; } = null!;
    public DbSet<Service> Services { get; set; } = null!;
    public DbSet<TourService> TourServices { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Client>()
            .HasMany(c => c.Bookings)
            .WithOne(b => b.Client)
            .HasForeignKey(b => b.ClientId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Tour>()
            .HasMany(t => t.Bookings)
            .WithOne(b => b.Tour)
            .HasForeignKey(b => b.TourId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<TourService>()
            .HasKey(ts => new { ts.TourId, ts.ServiceId });

        modelBuilder.Entity<TourService>()
            .HasOne(ts => ts.Tour)
            .WithMany(t => t.TourServices)
            .HasForeignKey(ts => ts.TourId);

        modelBuilder.Entity<TourService>()
            .HasOne(ts => ts.Service)
            .WithMany(s => s.TourServices)
            .HasForeignKey(ts => ts.ServiceId);
    }
}
