using Auth.DTOs;
using Auth.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Auth.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(IAuthService authService) : ControllerBase
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

    /// <summary>
    /// Yönetici, kendi binasındaki bir daireye sakin kaydeder.
    /// </summary>
    [HttpPost("register-sakin")]
    [Authorize(Roles = "yonetici,admin")]
    public async Task<IActionResult> RegisterSakin(RegisterSakinDto dto)
    {
        try
        {
            var result = await authService.RegisterSakinAsync(dto);
            return Created(string.Empty, result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
