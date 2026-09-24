using Auth.DTOs;

namespace Auth.Services;

public interface IAuthService
{
    Task<AuthResponseDto?> LoginAsync(LoginDto dto);
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
    Task<AuthResponseDto> RegisterSakinAsync(RegisterSakinDto dto);
    Task<bool> DeleteAccountAsync(Guid userId);
}
