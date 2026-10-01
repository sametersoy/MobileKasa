using Auth.Data;
using Auth.DTOs;
using Auth.Models;
using Google.Apis.Auth;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Auth.Services;

public class AuthService(AppDbContext db, IJwtService jwtService, IConfiguration config) : IAuthService
{
    public async Task<AuthResponseDto?> LoginAsync(LoginDto dto)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email && u.IsActive);
        if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return null;

        return new AuthResponseDto(jwtService.GenerateToken(user), user.Email, user.FullName, user.Role, user.BuildingId);
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        var user = new User
        {
            Email = dto.Email,
            FullName = dto.FullName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = "yonetici"
        };

        db.Users.Add(user);
        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException pg && pg.SqlState == "23505")
        {
            throw new InvalidOperationException("Bu e-posta adresi zaten kayıtlı.");
        }

        return new AuthResponseDto(jwtService.GenerateToken(user), user.Email, user.FullName, user.Role, null);
    }

    /// <summary>
    /// Google ID token'ı doğrular; e-posta kayıtlıysa giriş yapar, değilse yönetici olarak kaydeder.
    /// </summary>
    public async Task<AuthResponseDto> GoogleLoginAsync(GoogleLoginDto dto)
    {
        var audiences = GetGoogleClientIds(config);
        if (audiences.Length == 0)
            throw new InvalidOperationException("Google ile giriş yapılandırılmamış.");

        GoogleJsonWebSignature.Payload payload;
        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(dto.IdToken,
                new GoogleJsonWebSignature.ValidationSettings { Audience = audiences });
        }
        catch (InvalidJwtException)
        {
            throw new UnauthorizedAccessException("Google oturumu doğrulanamadı.");
        }

        if (!payload.EmailVerified || string.IsNullOrEmpty(payload.Email))
            throw new UnauthorizedAccessException("Google hesabının e-posta adresi doğrulanmamış.");

        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == payload.Email);
        if (user is not null)
        {
            if (!user.IsActive) throw new UnauthorizedAccessException("Hesap devre dışı.");
            return new AuthResponseDto(jwtService.GenerateToken(user), user.Email, user.FullName, user.Role, user.BuildingId);
        }

        user = new User
        {
            Email = payload.Email,
            FullName = string.IsNullOrWhiteSpace(payload.Name) ? payload.Email : payload.Name,
            // Google ile açılan hesabın bilinen bir şifresi yok; "Şifremi unuttum" ile şifre belirlenebilir
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32))),
            Role = "yonetici"
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        return new AuthResponseDto(jwtService.GenerateToken(user), user.Email, user.FullName, user.Role, null);
    }

    public static string[] GetGoogleClientIds(IConfiguration config) =>
        new[] { config["Google:WebClientId"], config["Google:IosClientId"], config["Google:AndroidClientId"] }
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Select(id => id!)
            .ToArray();

    public async Task<bool> DeleteAccountAsync(Guid userId)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null) return false;

        db.Users.Remove(user);
        await db.SaveChangesAsync();
        return true;
    }
}
