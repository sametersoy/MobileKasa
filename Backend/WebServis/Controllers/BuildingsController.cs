using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebServis.Data;
using WebServis.DTOs;
using WebServis.Helpers;
using WebServis.Models;

namespace WebServis.Controllers;

[Route("api/buildings")]
public class BuildingsController(AppDbContext db) : BaseController(db)
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var buildings = await Db.Buildings
            .Where(b => b.IsActive && (b.CreatedByUserId == UserId || b.Members.Any(m => m.UserId == UserId)))
            .Select(b => new BuildingDto(b.Id, b.Name, b.Address, b.Type, b.CreatedAt, b.Units.Count))
            .ToListAsync();
        return Ok(buildings);
    }

    [HttpGet("{id}/residents")]
    public async Task<IActionResult> GetResidents(Guid id)
    {
        if (!await HasBuildingAccessAsync(id)) return Forbid();

        var residents = await Db.ResidentUsers
            .Where(u => u.BuildingId == id && u.Role == "sakin" && u.IsActive)
            .OrderBy(u => u.FullName)
            .Select(u => new ResidentListDto(
                u.Id,
                u.FullName,
                MaskHelper.MaskEmail(u.Email),
                MaskHelper.MaskPhone(u.Phone),
                u.BuildingId,
                u.ResidentUnits.Select(ru => ru.UnitId).ToList(),
                u.CreatedAt))
            .ToListAsync();

        return Ok(residents);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(Guid id)
    {
        if (!await HasBuildingAccessAsync(id)) return Forbid();
        var b = await Db.Buildings.Include(x => x.Units).FirstOrDefaultAsync(x => x.Id == id);
        if (b is null) return NotFound();
        return Ok(new BuildingDto(b.Id, b.Name, b.Address, b.Type, b.CreatedAt, b.Units.Count));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateBuildingDto dto)
    {
        var building = new Building
        {
            Name = dto.Name,
            Address = dto.Address,
            Type = dto.Type,
            CreatedByUserId = UserId
        };
        Db.Buildings.Add(building);
        await Db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = building.Id },
            new BuildingDto(building.Id, building.Name, building.Address, building.Type, building.CreatedAt, 0));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, UpdateBuildingDto dto)
    {
        if (!await HasBuildingAccessAsync(id)) return Forbid();
        var building = await Db.Buildings.FindAsync(id);
        if (building is null) return NotFound();
        building.Name = dto.Name;
        building.Address = dto.Address;
        building.Type = dto.Type;
        await Db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var building = await Db.Buildings.FirstOrDefaultAsync(b => b.Id == id && b.CreatedByUserId == UserId);
        if (building is null) return NotFound();
        building.IsActive = false;
        await Db.SaveChangesAsync();
        return NoContent();
    }
}
