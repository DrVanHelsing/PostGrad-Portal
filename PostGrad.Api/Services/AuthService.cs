using PostGrad.Api.Models;
using PostGrad.Api.Dtos;
using BCrypt.Net;

namespace PostGrad.Api.Services;

public interface IAuthService
{
    Task<(User? user, string? error)> ValidateCredentialsAsync(string email, string password);
    Task<bool> ChangePasswordAsync(string userId, string currentPassword, string newPassword);
    string GenerateJwtToken(User user);
    string GenerateTemporaryPassword(int length = 12);
    string GenerateAccessCode();
}

public class AuthService : IAuthService
{
    private readonly IFirestoreService _firestore;
    private readonly IConfiguration _config;

    public AuthService(IFirestoreService firestore, IConfiguration config)
    {
        _firestore = firestore;
        _config = config;
    }

    public async Task<(User? user, string? error)> ValidateCredentialsAsync(string email, string password)
    {
        var normalised = email.Trim().ToLowerInvariant();
        var users = await _firestore.QueryAsync<User>(Collections.Users, ("email", "==", normalised));
        var user = users.FirstOrDefault();
        if (user == null)
            return (null, "No user profile found for this email address.");

        // Accept localPassword, generatedPassword, or default Portal@2026
        var accepted = user.LocalPassword
                    ?? user.GeneratedPassword
                    ?? _config["Auth:DefaultPassword"]
                    ?? "Portal@2026";

        // Support BCrypt-hashed passwords as well as plaintext (legacy seeds)
        bool valid = IsBcryptHash(accepted)
            ? BCrypt.Net.BCrypt.Verify(password, accepted)
            : password == accepted;

        if (!valid)
            return (null, "Invalid email or password.");

        return (user, null);
    }

    public async Task<bool> ChangePasswordAsync(string userId, string currentPassword, string newPassword)
    {
        var user = await _firestore.GetDocAsync<User>(Collections.Users, userId);
        if (user == null) return false;

        var accepted = user.LocalPassword ?? user.GeneratedPassword ?? "Portal@2026";
        bool valid = IsBcryptHash(accepted)
            ? BCrypt.Net.BCrypt.Verify(currentPassword, accepted)
            : currentPassword == accepted;

        if (!valid) return false;

        var hashedNew = BCrypt.Net.BCrypt.HashPassword(newPassword);
        await _firestore.UpdateDocAsync(Collections.Users, userId, new Dictionary<string, object>
        {
            { "localPassword", hashedNew },
            { "mustChangePassword", false },
        });
        return true;
    }

    public string GenerateJwtToken(User user)
    {
        var key = _config["Jwt:Key"] ?? throw new InvalidOperationException("JWT key not configured.");
        var issuer = _config["Jwt:Issuer"] ?? "postgrad-portal";
        var audience = _config["Jwt:Audience"] ?? "postgrad-portal";
        var expiryHours = int.TryParse(_config["Jwt:ExpiryHours"], out var h) ? h : 8;

        var securityKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(
            System.Text.Encoding.UTF8.GetBytes(key));
        var credentials = new Microsoft.IdentityModel.Tokens.SigningCredentials(
            securityKey, Microsoft.IdentityModel.Tokens.SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, user.Id),
            new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Email, user.Email),
            new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Name, user.Name),
            new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Role, user.Role),
            new System.Security.Claims.Claim("mustChangePassword", user.MustChangePassword.ToString().ToLower()),
        };

        var token = new System.IdentityModel.Tokens.Jwt.JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(expiryHours),
            signingCredentials: credentials);

        return new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateTemporaryPassword(int length = 12)
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
        var rng = System.Security.Cryptography.RandomNumberGenerator.Create();
        var result = new char[length];
        var buffer = new byte[length];
        rng.GetBytes(buffer);
        for (int i = 0; i < length; i++)
            result[i] = chars[buffer[i] % chars.Length];
        return new string(result);
    }

    public string GenerateAccessCode()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        var rng = System.Security.Cryptography.RandomNumberGenerator.Create();
        var result = new char[6];
        var buffer = new byte[6];
        rng.GetBytes(buffer);
        for (int i = 0; i < 6; i++)
            result[i] = chars[buffer[i] % chars.Length];
        return new string(result);
    }

    private static bool IsBcryptHash(string value) =>
        value.StartsWith("$2a$") || value.StartsWith("$2b$") || value.StartsWith("$2y$");
}
