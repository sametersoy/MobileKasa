using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MobileServis.Data;
using MobileServis.DTOs;
using MobileServis.Models;

namespace MobileServis.Controllers;

[Route("api/buildings/{buildingId}/meters")]
public class MetersController(AppDbContext db) : BaseController(db)
{
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid buildingId)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var meters = await Db.Meters.Include(m => m.Unit).Include(m => m.Readings)
            .Where(m => m.Unit.BuildingId == buildingId)
            .ToListAsync();
        var result = meters.Select(m =>
        {
            var last = m.Readings.OrderByDescending(r => r.ReadingDate).FirstOrDefault();
            return new MobileMeterDto(m.Id, m.Unit.Number, m.Type, m.SerialNumber, last?.Value, last?.ReadingDate);
        });
        return Ok(result);
    }

    [HttpGet("{meterId}/readings")]
    public async Task<IActionResult> GetReadings(Guid buildingId, Guid meterId,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var q = Db.MeterReadings.Where(r => r.MeterId == meterId);
        var total = await q.CountAsync();
        var data = await q.OrderByDescending(r => r.ReadingDate)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(r => new MobileReadingDto(r.Id, r.ReadingDate, r.Value, r.PreviousValue, r.Amount))
            .ToListAsync();
        return Ok(new PagedResult<MobileReadingDto>(data, total, page, pageSize));
    }

    [HttpPost("{meterId}/readings")]
    public async Task<IActionResult> AddReading(Guid buildingId, Guid meterId, CreateReadingDto dto)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var lastReading = await Db.MeterReadings
            .Where(r => r.MeterId == meterId).OrderByDescending(r => r.ReadingDate).FirstOrDefaultAsync();
        var prevValue = lastReading?.Value ?? 0;
        var reading = new MeterReading
        {
            MeterId = meterId, ReadingDate = dto.ReadingDate,
            Value = dto.Value, PreviousValue = prevValue,
            UnitPrice = dto.UnitPrice, Amount = (dto.Value - prevValue) * dto.UnitPrice
        };
        Db.MeterReadings.Add(reading);
        await Db.SaveChangesAsync();
        return Created(string.Empty, new MobileReadingDto(reading.Id, reading.ReadingDate, reading.Value, reading.PreviousValue, reading.Amount));
    }
}
