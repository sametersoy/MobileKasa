using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MobileServis.Data;
using MobileServis.DTOs;

namespace MobileServis.Controllers;

[Route("api/buildings/{buildingId}/notifications")]
public class NotificationsController(AppDbContext db) : BaseController(db)
{
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid buildingId,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 30,
        [FromQuery] bool? unreadOnly = null)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var q = Db.Notifications.Where(n => n.BuildingId == buildingId
            && (n.TargetUserId == null || n.TargetUserId == UserId));
        if (unreadOnly == true) q = q.Where(n => !n.IsRead);
        var total = await q.CountAsync();
        var data = await q.OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(n => new MobileNotificationDto(n.Id, n.Title, n.Body, n.Type, n.IsRead, n.CreatedAt))
            .ToListAsync();
        return Ok(new PagedResult<MobileNotificationDto>(data, total, page, pageSize));
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> UnreadCount(Guid buildingId)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var count = await Db.Notifications.CountAsync(n =>
            n.BuildingId == buildingId && !n.IsRead
            && (n.TargetUserId == null || n.TargetUserId == UserId));
        return Ok(new { count });
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
