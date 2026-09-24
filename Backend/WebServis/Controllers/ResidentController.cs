using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebServis.Data;
using WebServis.DTOs;

namespace WebServis.Controllers;

[Route("api/resident")]
[Authorize(Roles = "sakin")]
public class ResidentController(AppDbContext db) : BaseController(db)
{
    /// <summary>
    /// Oturum açmış sakinin kendi dairesi, aidatları, sayaçları ve bildirimlerini tek istekte döner.
    /// </summary>
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        if (ClaimUnitId is null || ClaimBuildingId is null)
            return BadRequest(new { message = "Token'da daire bilgisi bulunamadı." });

        var unit = await Db.Units
            .Include(u => u.Building)
            .Include(u => u.Meters).ThenInclude(m => m.Readings.OrderByDescending(r => r.ReadingDate).Take(1))
            .Include(u => u.Dues)
            .FirstOrDefaultAsync(u => u.Id == ClaimUnitId && u.BuildingId == ClaimBuildingId);

        if (unit is null) return NotFound(new { message = "Daire bulunamadı." });

        var notifications = await Db.Notifications
            .Where(n => n.BuildingId == ClaimBuildingId
                && (n.TargetUserId == null || n.TargetUserId == UserId))
            .OrderByDescending(n => n.CreatedAt)
            .Take(10)
            .ToListAsync();

        var unitDto = new ResidentUnitDto(
            unit.Id,
            unit.Number,
            unit.Floor,
            unit.Type,
            unit.AreaM2,
            unit.IsOccupied,
            new ResidentBuildingDto(unit.Building.Id, unit.Building.Name, unit.Building.Address, unit.Building.Type.ToString())
        );

        var unpaidDues = unit.Dues
            .Where(d => !d.IsPaid)
            .OrderBy(d => d.DueDate)
            .Select(d => new ResidentDuesDto(d.Id, d.Period, d.Amount, d.DueDate, d.IsPaid, d.PaidDate, d.Note));

        var meters = unit.Meters.Select(m =>
        {
            var last = m.Readings.FirstOrDefault();
            return new ResidentMeterDto(
                m.Id,
                $"{m.Type} ({m.SerialNumber})",
                m.Type,
                m.Type switch { WebServis.Models.MeterType.Electric => "kWh", WebServis.Models.MeterType.Gas => "m³", _ => "m³" },
                last?.Value,
                last is null ? null : last.ReadingDate.ToDateTime(TimeOnly.MinValue)
            );
        });

        var notifDtos = notifications.Select(n => new ResidentNotificationDto(
            n.Id, n.Title, n.Body, n.Type, n.IsRead, n.CreatedAt));

        return Ok(new ResidentDashboardDto(unitDto, unpaidDues, meters, notifDtos));
    }

    /// <summary>
    /// Sakinin okunmamış bildirimleri okundu olarak işaretler.
    /// </summary>
    [HttpPost("notifications/mark-read")]
    public async Task<IActionResult> MarkNotificationsRead()
    {
        if (ClaimBuildingId is null) return BadRequest();

        await Db.Notifications
            .Where(n => n.BuildingId == ClaimBuildingId
                && (n.TargetUserId == null || n.TargetUserId == UserId)
                && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));

        return NoContent();
    }
}
