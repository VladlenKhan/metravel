using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Application.Modules.Auth.Interfaces;
using Domain.Users;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Infrastructure.Modules.Auth.Security;

public class JwtTokenGenerator : IJwtTokenGenerator
{
    private readonly IConfiguration _configuration;

    public JwtTokenGenerator(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(User user)
    {
        var issuer = _configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("Jwt:Issuer is not configured.");
        var audience = _configuration["Jwt:Audience"] ?? throw new InvalidOperationException("Jwt:Audience is not configured.");
        var secret = _configuration["Jwt:Secret"] ?? throw new InvalidOperationException("Jwt:Secret is not configured.");
        var expiresInMinutes = int.TryParse(_configuration["Jwt:ExpiresInMinutes"], out var minutes) ? minutes : 60;

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.FullName),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, user.Role.ToString())
        };

        if (user.ClientId.HasValue)
        {
            claims.Add(new Claim("client_id", user.ClientId.Value.ToString()));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiresInMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
