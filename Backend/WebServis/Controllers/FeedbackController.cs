using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using WebServis.Helpers;
using Microsoft.EntityFrameworkCore;
using WebServis.Data;
using WebServis.DTOs;
using WebServis.Models;

namespace WebServis.Controllers;

[Route("api/feedback")]
public class FeedbackController(AppDbContext db) : BaseController(db)
{
    // Herhangi bir oturum açmış kullanıcı gönderebilir
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateFeedbackDto dto)
    {
        var email = User.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
        var name  = User.FindFirstValue("fullName") ?? User.FindFirstValue(ClaimTypes.Name) ?? email;
        var buildingId = ClaimBuildingId;

        if (string.IsNullOrWhiteSpace(dto.Subject) || string.IsNullOrWhiteSpace(dto.Message))
            return BadRequest("Konu ve mesaj zorunludur.");

        if (dto.Rating.HasValue && (dto.Rating < 1 || dto.Rating > 5))
            return BadRequest("Puan 1-5 arasında olmalıdır.");

        var fb = new Feedback
        {
            UserId     = UserId,
            UserName   = name,
            UserEmail  = email,
            BuildingId = buildingId,
            Type       = dto.Type,
            Subject    = dto.Subject,
            Message    = dto.Message,
            Rating     = dto.Rating,
        };
        Db.Feedbacks.Add(fb);
        await Db.SaveChangesAsync();
        return Created(string.Empty, ToDto(fb));
    }

    // Sadece yönetici / admin listeleyebilir
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool? unreadOnly, [FromQuery] FeedbackStatus? status)
    {
        if (UserRole is not ("yonetici" or "admin")) return Forbid();

        var q = Db.Feedbacks.AsQueryable();

        // Yönetici sadece kendi binasına ait bildirimleri görür
        if (UserRole == "yonetici" && ClaimBuildingId.HasValue)
            q = q.Where(f => f.BuildingId == ClaimBuildingId);

        if (unreadOnly == true) q = q.Where(f => !f.IsRead);
        if (status.HasValue)    q = q.Where(f => f.Status == status);

        var list = await q.OrderByDescending(f => f.CreatedAt)
            .Select(f => ToDto(f))
            .ToListAsync();
        return Ok(list);
    }

    [HttpPatch("{id}/read")]
    public async Task<IActionResult> MarkRead(Guid id)
    {
        if (UserRole is not ("yonetici" or "admin")) return Forbid();
        var fb = await Db.Feedbacks.FindAsync(id);
        if (fb is null) return NotFound();
        fb.IsRead = true;
        await Db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateFeedbackStatusDto dto)
    {
        if (UserRole is not ("yonetici" or "admin")) return Forbid();
        var fb = await Db.Feedbacks.FindAsync(id);
        if (fb is null) return NotFound();
        fb.Status = dto.Status;
        await Db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        if (UserRole is not ("yonetici" or "admin")) return Forbid();
        var fb = await Db.Feedbacks.FindAsync(id);
        if (fb is null) return NotFound();
        Db.Feedbacks.Remove(fb);
        await Db.SaveChangesAsync();
        return NoContent();
    }

    private static FeedbackDto ToDto(Feedback f) => new(
        f.Id, f.UserId, f.UserName, MaskHelper.MaskEmail(f.UserEmail), f.BuildingId,
        f.Type, f.Subject, f.Message, f.Rating, f.Status, f.IsRead, f.CreatedAt);
}
