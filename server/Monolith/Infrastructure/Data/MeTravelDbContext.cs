using Domain.Audit;
using Domain.Clients;
using Domain.Payments;
using Domain.Services;
using Domain.Tours;
using Domain.Users;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure;

public class MeTravelDbContext : DbContext
{
    public MeTravelDbContext(DbContextOptions<MeTravelDbContext> options) : base(options)
    {
    }

    public DbSet<Client> Clients { get; set; } = null!;
    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Payment> Payments { get; set; } = null!;
    public DbSet<Tour> Tours { get; set; } = null!;
    public DbSet<Service> Services { get; set; } = null!;
    public DbSet<TourService> TourServices { get; set; } = null!;
    public DbSet<AuditLog> AuditLogs { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

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

        modelBuilder.Entity<Client>(entity =>
        {
            entity.Property(c => c.FullName).HasMaxLength(200);
            entity.Property(c => c.Email).HasMaxLength(200);
            entity.Property(c => c.PhoneNumber).HasMaxLength(50);
            entity.Property(c => c.PassportNumber).HasMaxLength(50);
            entity.HasIndex(c => c.Email).IsUnique();
            entity.HasIndex(c => c.PassportNumber).IsUnique();
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.Property(u => u.FullName).HasMaxLength(200);
            entity.Property(u => u.Email).HasMaxLength(200);
            entity.Property(u => u.PasswordHash).HasMaxLength(500);
            entity.Property(u => u.Role).HasConversion<string>().HasMaxLength(50);
            entity.HasIndex(u => u.Email).IsUnique();
            entity.HasIndex(u => u.ClientId).IsUnique();
            entity.HasOne(u => u.Client)
                .WithOne()
                .HasForeignKey<User>(u => u.ClientId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.Property(p => p.Amount).HasColumnType("numeric(18,2)");
            entity.Property(p => p.Status).HasConversion<string>().HasMaxLength(50);
            entity.HasIndex(p => p.BookingId).IsUnique();
        });

        modelBuilder.Entity<Service>(entity =>
        {
            entity.Property(s => s.Name).HasMaxLength(200);
            entity.Property(s => s.Description).HasMaxLength(2000);
            entity.Property(s => s.Price).HasColumnType("numeric(18,2)");
        });
    }
}
