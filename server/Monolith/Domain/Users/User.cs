using Domain.Clients;

namespace Domain.Users;

public class User
{
    public Guid Id { get; set; }

    public string FullName { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public UserRole Role { get; set; } = UserRole.Client;

    public bool IsActive { get; set; } = true;

    public Guid? ClientId { get; set; }

    public Client? Client { get; set; }
}
