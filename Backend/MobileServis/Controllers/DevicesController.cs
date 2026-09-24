using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MobileServis.Data;
using MobileServis.DTOs;
using MobileServis.Models;

namespace MobileServis.Controllers;

[Route("api/devices")]
public class DevicesController(AppDbContext db) : BaseController(db)
{
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDeviceDto dto)
    {
        var existing = await Db.DeviceTokens.FirstOrDefaultAsync(d => d.UserId == UserId && d.Token == dto.Token);
        if (existing is not null)
        {
            existing.LastSeenAt = DateTime.UtcNow;
            existing.IsActive = true;
            existing.Platform = dto.Platform;
        }
        else
        {
            Db.DeviceTokens.Add(new DeviceToken
            {
                UserId = UserId,
                Token = dto.Token,
                Platform = dto.Platform
            });
        }
        await Db.SaveChangesAsync();
        return Ok(new { message = "Cihaz kaydedildi." });
    }

    [HttpDelete("unregister")]
    public async Task<IActionResult> Unregister([FromBody] string token)
    {
        var device = await Db.DeviceTokens.FirstOrDefaultAsync(d => d.UserId == UserId && d.Token == token);
        if (device is null) return NotFound();
        device.IsActive = false;
        await Db.SaveChangesAsync();
        return NoContent();
    }
}
