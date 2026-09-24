using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebServis.Data;
using WebServis.DTOs;
using WebServis.Models;

namespace WebServis.Controllers;

[Route("api/buildings/{buildingId}/notifications")]
public class NotificationsController(AppDbContext db) : BaseController(db)
{
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid buildingId, [FromQuery] bool? unreadOnly)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var q = Db.Notifications.Where(n => n.BuildingId == buildingId
            && (n.TargetUserId == null || n.TargetUserId == UserId));
        if (unreadOnly == true) q = q.Where(n => !n.IsRead);
        var list = await q.OrderByDescending(n => n.CreatedAt)
            .Select(n => new NotificationDto(n.Id, n.BuildingId, n.Title, n.Body, n.Type, n.IsRead, n.CreatedAt))
            .ToListAsync();
        return Ok(list);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid buildingId, CreateNotificationDto dto)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var n = new Notification
        {
            BuildingId = buildingId,
            Title = dto.Title,
            Body = dto.Body,
            Type = dto.Type,
            TargetUserId = dto.TargetUserId,
            CreatedByUserId = UserId
        };
        Db.Notifications.Add(n);
        await Db.SaveChangesAsync();
        return Created(string.Empty, new NotificationDto(n.Id, n.BuildingId, n.Title, n.Body, n.Type, n.IsRead, n.CreatedAt));
    }

    [HttpPatch("{id}/read")]
    public async Task<IActionResult> MarkRead(Guid buildingId, Guid id)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var n = await Db.Notifications.FirstOrDefaultAsync(x => x.Id == id && x.BuildingId == buildingId);
        if (n is null) return NotFound();
        n.IsRead = true;
        await Db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllRead(Guid buildingId)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        await Db.Notifications
            .Where(n => n.BuildingId == buildingId && !n.IsRead
                && (n.TargetUserId == null || n.TargetUserId == UserId))
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
        return NoContent();
    }
}
