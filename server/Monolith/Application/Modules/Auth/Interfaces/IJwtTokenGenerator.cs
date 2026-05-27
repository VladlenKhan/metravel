using Domain.Users;

namespace Application.Modules.Auth.Interfaces;

public interface IJwtTokenGenerator
{
    string GenerateToken(User user);
}
