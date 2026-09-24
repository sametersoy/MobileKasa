using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebServis.Data;
using WebServis.DTOs;
using WebServis.Models;

namespace WebServis.Controllers;

[Route("api/buildings/{buildingId}/units")]
public class UnitsController(AppDbContext db) : BaseController(db)
{
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid buildingId)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var units = await Db.Units
            .Where(u => u.BuildingId == buildingId)
            .OrderBy(u => u.Floor).ThenBy(u => u.Number)
            .Select(u => new UnitDto(u.Id, u.BuildingId, u.Number, u.Floor, u.Type, u.AreaM2, u.IsOccupied))
            .ToListAsync();
        return Ok(units);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(Guid buildingId, Guid id)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var u = await Db.Units.FirstOrDefaultAsync(x => x.Id == id && x.BuildingId == buildingId);
        if (u is null) return NotFound();
        return Ok(new UnitDto(u.Id, u.BuildingId, u.Number, u.Floor, u.Type, u.AreaM2, u.IsOccupied));
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid buildingId, CreateUnitDto dto)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var unit = new Unit
        {
            BuildingId = buildingId,
            Number = dto.Number,
            Floor = dto.Floor,
            Type = dto.Type,
            AreaM2 = dto.AreaM2
        };
        Db.Units.Add(unit);
        await Db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { buildingId, id = unit.Id },
            new UnitDto(unit.Id, unit.BuildingId, unit.Number, unit.Floor, unit.Type, unit.AreaM2, unit.IsOccupied));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid buildingId, Guid id, UpdateUnitDto dto)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var unit = await Db.Units.FirstOrDefaultAsync(x => x.Id == id && x.BuildingId == buildingId);
        if (unit is null) return NotFound();
        unit.Number = dto.Number;
        unit.Floor = dto.Floor;
        unit.Type = dto.Type;
        unit.AreaM2 = dto.AreaM2;
        unit.IsOccupied = dto.IsOccupied;
        await Db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid buildingId, Guid id)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var unit = await Db.Units.FirstOrDefaultAsync(x => x.Id == id && x.BuildingId == buildingId);
        if (unit is null) return NotFound();
        Db.Units.Remove(unit);
        await Db.SaveChangesAsync();
        return NoContent();
    }
}
