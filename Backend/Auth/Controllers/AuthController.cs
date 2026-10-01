using Auth.DTOs;
using Auth.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Auth.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(IAuthService authService, IConfiguration config) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var result = await authService.LoginAsync(dto);
        if (result is null) return Unauthorized(new { message = "Geçersiz e-posta veya şifre." });
        return Ok(result);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        try
        {
            var result = await authService.RegisterAsync(dto);
            return Created(string.Empty, result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Google ile giriş / kayıt. İstemci, Google'dan aldığı ID token'ı gönderir.
    /// </summary>
    [HttpPost("google")]
    public async Task<IActionResult> Google(GoogleLoginDto dto)
    {
        try
        {
            return Ok(await authService.GoogleLoginAsync(dto));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// İstemcilerin Google Sign-In'i başlatması için gereken (gizli olmayan) client ID'ler.
    /// </summary>
    [HttpGet("google/config")]
    public IActionResult GoogleConfig() =>
        Ok(new GoogleConfigDto(config["Google:WebClientId"], config["Google:IosClientId"]));

    [HttpDelete("account")]
    [Authorize]
    public async Task<IActionResult> DeleteAccount()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var deleted = await authService.DeleteAccountAsync(userId);
        if (!deleted) return NotFound();
        return NoContent();
    }
}
