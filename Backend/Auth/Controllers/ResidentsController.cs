using Auth.Data;
using Auth.DTOs;
using Auth.Helpers;
using Auth.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Auth.Controllers;

[ApiController]
[Route("api/residents")]
[Authorize(Roles = "yonetici,admin")]
public class ResidentsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid buildingId)
    {
        var residents = await db.Users
            .Where(u => u.BuildingId == buildingId && u.Role == "sakin" && u.IsActive)
            .OrderBy(u => u.FullName)
            .Select(u => new ResidentDto(
                u.Id, u.FullName, MaskHelper.MaskEmail(u.Email), MaskHelper.MaskPhone(u.Phone), u.BuildingId,
                u.ResidentUnits.Select(ru => ru.UnitId).ToList(),
                u.CreatedAt))
            .ToListAsync();
        return Ok(residents);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Deactivate(Guid id)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == id && u.Role == "sakin");
        if (user is null) return NotFound();
        user.IsActive = false;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, UpdateResidentDto dto)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == id && u.Role == "sakin");
        if (user is null) return NotFound();
        user.FullName = dto.FullName;
        user.Phone = dto.Phone;
        await db.SaveChangesAsync();
        var unitIds = await db.ResidentUnits.Where(ru => ru.UserId == id).Select(ru => ru.UnitId).ToListAsync();
        return Ok(new ResidentDto(user.Id, user.FullName, MaskHelper.MaskEmail(user.Email), MaskHelper.MaskPhone(user.Phone), user.BuildingId, unitIds, user.CreatedAt));
    }

    [HttpPost("{id}/units")]
    public async Task<IActionResult> AddUnit(Guid id, UpdateResidentUnitDto dto)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == id && u.Role == "sakin");
        if (user is null) return NotFound();
        var exists = await db.ResidentUnits.AnyAsync(ru => ru.UserId == id && ru.UnitId == dto.UnitId);
        if (!exists)
        {
            db.ResidentUnits.Add(new ResidentUnit { UserId = id, UnitId = dto.UnitId });
            await db.SaveChangesAsync();
        }
        var unitIds = await db.ResidentUnits.Where(ru => ru.UserId == id).Select(ru => ru.UnitId).ToListAsync();
        return Ok(new ResidentDto(user.Id, user.FullName, MaskHelper.MaskEmail(user.Email), MaskHelper.MaskPhone(user.Phone), user.BuildingId, unitIds, user.CreatedAt));
    }

    [HttpDelete("{id}/units/{unitId}")]
    public async Task<IActionResult> RemoveUnit(Guid id, Guid unitId)
    {
        var entry = await db.ResidentUnits.FirstOrDefaultAsync(ru => ru.UserId == id && ru.UnitId == unitId);
        if (entry is null) return NotFound();
        db.ResidentUnits.Remove(entry);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
