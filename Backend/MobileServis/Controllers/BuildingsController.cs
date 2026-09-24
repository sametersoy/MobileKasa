using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MobileServis.Data;
using MobileServis.DTOs;
using MobileServis.Models;

namespace MobileServis.Controllers;

[Route("api/buildings")]
public class BuildingsController(AppDbContext db) : BaseController(db)
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var q = Db.Buildings.Include(b => b.Units)
            .Where(b => b.IsActive && (b.CreatedByUserId == UserId || b.Members.Any(m => m.UserId == UserId)));
        var total = await q.CountAsync();
        var data = await q.OrderBy(b => b.Name)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(b => new MobileBuildingDto(b.Id, b.Name, b.Address, b.Type, b.Units.Count, b.CreatedAt))
            .ToListAsync();
        return Ok(new PagedResult<MobileBuildingDto>(data, total, page, pageSize));
    }

    [HttpGet("{id}/residents")]
    public async Task<IActionResult> GetResidents(Guid id)
    {
        if (!await HasBuildingAccessAsync(id)) return Forbid();
        var residents = await Db.ResidentUsers
            .Include(u => u.ResidentUnits)
            .Where(u => u.BuildingId == id && u.Role == "sakin" && u.IsActive)
            .OrderBy(u => u.FullName)
            .Select(u => new MobileResidentDto(
                u.Id, u.FullName, u.Email, u.Phone,
                u.ResidentUnits.Select(ru => ru.UnitId).ToList()))
            .ToListAsync();
        return Ok(residents);
    }

    [HttpGet("{id}/units")]
    public async Task<IActionResult> GetUnits(Guid id, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        if (!await HasBuildingAccessAsync(id)) return Forbid();
        var q = Db.Units.Where(u => u.BuildingId == id);
        var total = await q.CountAsync();
        var data = await q.OrderBy(u => u.Floor).ThenBy(u => u.Number)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(u => new MobileUnitDto(u.Id, u.Number, u.Floor, u.Type, u.AreaM2, u.IsOccupied))
            .ToListAsync();
        return Ok(new PagedResult<MobileUnitDto>(data, total, page, pageSize));
    }

    [HttpPut("{id}/units/{unitId}")]
    public async Task<IActionResult> UpdateUnit(Guid id, Guid unitId, [FromBody] UpdateUnitDto dto)
    {
        if (!await HasBuildingAccessAsync(id)) return Forbid();
        var unit = await Db.Units.FirstOrDefaultAsync(u => u.Id == unitId && u.BuildingId == id);
        if (unit is null) return NotFound();
        unit.Number = dto.Number;
        unit.Floor = dto.Floor;
        unit.Type = dto.Type;
        unit.AreaM2 = dto.AreaM2;
        unit.IsOccupied = dto.IsOccupied;
        await Db.SaveChangesAsync();
        return Ok(new MobileUnitDto(unit.Id, unit.Number, unit.Floor, unit.Type, unit.AreaM2, unit.IsOccupied));
    }

    [HttpPost("{id}/units")]
    public async Task<IActionResult> CreateUnit(Guid id, [FromBody] CreateUnitDto dto)
    {
        if (!await HasBuildingAccessAsync(id)) return Forbid();
        var unit = new Unit
        {
            BuildingId = id,
            Number = dto.Number,
            Floor = dto.Floor,
            Type = dto.Type,
            AreaM2 = dto.AreaM2,
            IsOccupied = dto.IsOccupied,
        };
        Db.Units.Add(unit);
        await Db.SaveChangesAsync();
        return Ok(new MobileUnitDto(unit.Id, unit.Number, unit.Floor, unit.Type, unit.AreaM2, unit.IsOccupied));
    }
}
