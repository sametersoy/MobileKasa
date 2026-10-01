using Auth.Data;
using Auth.DTOs;
using Auth.Models;
using Google.Apis.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
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

        return await SignInOrRegisterExternalAsync(payload.Email, payload.Name);
    }

    private const string AppleIssuer = "https://appleid.apple.com";

    // Apple'ın imza anahtarları (JWKS) önbelleklenir ve gerektiğinde yenilenir
    private static readonly ConfigurationManager<OpenIdConnectConfiguration> AppleOidc = new(
        $"{AppleIssuer}/.well-known/openid-configuration",
        new OpenIdConnectConfigurationRetriever(),
        new HttpDocumentRetriever { RequireHttps = true });

    /// <summary>
    /// Sign in with Apple identity token'ını doğrular; e-posta kayıtlıysa giriş yapar, değilse yönetici olarak kaydeder.
    /// Apple adı yalnızca ilk yetkilendirmede (token dışında) verdiği için istemci FullName'i ayrıca gönderir.
    /// </summary>
    public async Task<AuthResponseDto> AppleLoginAsync(AppleLoginDto dto)
    {
        var audiences = (config["Apple:BundleIds"] ?? "")
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (audiences.Length == 0)
            throw new InvalidOperationException("Apple ile giriş yapılandırılmamış.");

        var oidc = await AppleOidc.GetConfigurationAsync(CancellationToken.None);
        var result = await new JsonWebTokenHandler().ValidateTokenAsync(dto.IdentityToken, new TokenValidationParameters
        {
            ValidIssuer = AppleIssuer,
            ValidAudiences = audiences,
            IssuerSigningKeys = oidc.SigningKeys
        });
        if (!result.IsValid)
            throw new UnauthorizedAccessException("Apple oturumu doğrulanamadı.");

        var email = result.Claims.TryGetValue("email", out var e) ? e?.ToString() : null;
        if (string.IsNullOrEmpty(email))
            throw new UnauthorizedAccessException("Apple hesabı e-posta adresi paylaşmadı.");

        return await SignInOrRegisterExternalAsync(email, dto.FullName);
    }

    // Harici sağlayıcıyla (Google/Apple) doğrulanmış e-postayla giriş yapar; hesap yoksa yönetici olarak açar
    private async Task<AuthResponseDto> SignInOrRegisterExternalAsync(string email, string? fullName)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user is not null)
        {
            if (!user.IsActive) throw new UnauthorizedAccessException("Hesap devre dışı.");
            return new AuthResponseDto(jwtService.GenerateToken(user), user.Email, user.FullName, user.Role, user.BuildingId);
        }

        user = new User
        {
            Email = email,
            FullName = string.IsNullOrWhiteSpace(fullName) ? email : fullName,
            // Harici sağlayıcıyla açılan hesabın bilinen bir şifresi yok; "Şifremi unuttum" ile şifre belirlenebilir
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
