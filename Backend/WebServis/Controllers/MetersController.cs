using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebServis.Data;
using WebServis.DTOs;
using WebServis.Models;

namespace WebServis.Controllers;

[Route("api/buildings/{buildingId}/meters")]
public class MetersController(AppDbContext db) : BaseController(db)
{
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid buildingId)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var meters = await Db.Meters
            .Include(m => m.Unit)
            .Where(m => m.Unit.BuildingId == buildingId)
            .Select(m => new MeterDto(m.Id, m.UnitId, m.Unit.Number, m.Type, m.SerialNumber))
            .ToListAsync();
        return Ok(meters);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid buildingId, CreateMeterDto dto)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var unit = await Db.Units.FirstOrDefaultAsync(u => u.Id == dto.UnitId && u.BuildingId == buildingId);
        if (unit is null) return BadRequest("Daire bu binaya ait değil.");
        var meter = new Meter { UnitId = dto.UnitId, Type = dto.Type, SerialNumber = dto.SerialNumber };
        Db.Meters.Add(meter);
        await Db.SaveChangesAsync();
        return Created(string.Empty, new MeterDto(meter.Id, meter.UnitId, unit.Number, meter.Type, meter.SerialNumber));
    }

    [HttpGet("{meterId}/readings")]
    public async Task<IActionResult> GetReadings(Guid buildingId, Guid meterId)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var readings = await Db.MeterReadings
            .Where(r => r.MeterId == meterId)
            .OrderByDescending(r => r.ReadingDate)
            .Select(r => new ReadingDto(r.Id, r.MeterId, r.ReadingDate, r.Value, r.PreviousValue, r.UnitPrice, r.Amount, r.CreatedAt))
            .ToListAsync();
        return Ok(readings);
    }

    [HttpPost("{meterId}/readings")]
    public async Task<IActionResult> AddReading(Guid buildingId, Guid meterId, CreateReadingDto dto)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var lastReading = await Db.MeterReadings
            .Where(r => r.MeterId == meterId)
            .OrderByDescending(r => r.ReadingDate)
            .FirstOrDefaultAsync();
        var prevValue = lastReading?.Value ?? 0;
        var consumption = dto.Value - prevValue;
        var reading = new MeterReading
        {
            MeterId = meterId,
            ReadingDate = dto.ReadingDate,
            Value = dto.Value,
            PreviousValue = prevValue,
            UnitPrice = dto.UnitPrice,
            Amount = consumption * dto.UnitPrice
        };
        Db.MeterReadings.Add(reading);
        await Db.SaveChangesAsync();
        return Created(string.Empty, new ReadingDto(reading.Id, reading.MeterId, reading.ReadingDate, reading.Value, reading.PreviousValue, reading.UnitPrice, reading.Amount, reading.CreatedAt));
    }

    [HttpDelete("{meterId}")]
    public async Task<IActionResult> Delete(Guid buildingId, Guid meterId)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var meter = await Db.Meters.Include(m => m.Unit)
            .FirstOrDefaultAsync(m => m.Id == meterId && m.Unit.BuildingId == buildingId);
        if (meter is null) return NotFound();
        Db.Meters.Remove(meter);
        await Db.SaveChangesAsync();
        return NoContent();
    }
}
