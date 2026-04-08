using Application.Modules.Auth.Interfaces;
using Domain.Users;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Modules.Auth.Seeding;

public class AdminUserSeeder
{
    private readonly MeTravelDbContext _dbContext;
    private readonly IConfiguration _configuration;
    private readonly IPasswordHasherService _passwordHasherService;
    private readonly ILogger<AdminUserSeeder> _logger;

    public AdminUserSeeder(
        MeTravelDbContext dbContext,
        IConfiguration configuration,
        IPasswordHasherService passwordHasherService,
        ILogger<AdminUserSeeder> logger)
    {
        _dbContext = dbContext;
        _configuration = configuration;
        _passwordHasherService = passwordHasherService;
        _logger = logger;
    }

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        var section = _configuration.GetSection("SeedAdminUser");
        var enabled = section.GetValue("Enabled", false);
        if (!enabled)
        {
            return;
        }

        var fullName = section["FullName"]?.Trim();
        var email = section["Email"]?.Trim().ToLowerInvariant();
        var password = section["Password"];

        if (string.IsNullOrWhiteSpace(fullName) ||
            string.IsNullOrWhiteSpace(email) ||
            string.IsNullOrWhiteSpace(password))
        {
            _logger.LogWarning("Admin seed configuration is incomplete. Skipping admin creation.");
            return;
        }

        var adminExists = await _dbContext.Users
            .AsNoTracking()
            .AnyAsync(u => u.Email == email, cancellationToken);

        if (adminExists)
        {
            return;
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = fullName,
            Email = email,
            Role = UserRole.Admin,
            IsActive = true
        };

        user.PasswordHash = _passwordHasherService.HashPassword(user, password);

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Default admin user created. Email={Email}", email);
    }
}
