namespace Auth.DTOs;

public record LoginDto(string Email, string Password);
public record GoogleLoginDto(string IdToken);
public record GoogleConfigDto(string? WebClientId, string? IosClientId);
public record AppleLoginDto(string IdentityToken, string? FullName);
public record RegisterDto(string Email, string Password, string FullName);
public record AuthResponseDto(string Token, string Email, string FullName, string Role, Guid? BuildingId);
