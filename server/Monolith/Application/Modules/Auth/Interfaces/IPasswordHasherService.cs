using Domain.Users;

namespace Application.Modules.Auth.Interfaces;

public interface IPasswordHasherService
{
    string HashPassword(User user, string password);

    bool VerifyPassword(User user, string password);
}
