using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using MobileServis.Data;
using MobileServis.Models;

namespace MobileServis.Controllers;

[Route("api/feedback")]
public class FeedbackController(AppDbContext db) : BaseController(db)
{
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateFeedbackRequest req)
    {
        var email = User.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
        var name  = User.FindFirstValue("fullName") ?? User.FindFirstValue(ClaimTypes.Name) ?? email;
        Guid.TryParse(User.FindFirstValue("buildingId"), out var buildingId);

        if (string.IsNullOrWhiteSpace(req.Subject) || string.IsNullOrWhiteSpace(req.Message))
            return BadRequest(new { message = "Konu ve mesaj zorunludur." });

        var fb = new Feedback
        {
            UserId     = UserId,
            UserName   = name,
            UserEmail  = email,
            BuildingId = buildingId == Guid.Empty ? null : buildingId,
            Type       = req.Type,
            Subject    = req.Subject,
            Message    = req.Message,
            Rating     = req.Rating,
        };
        Db.Feedbacks.Add(fb);
        await Db.SaveChangesAsync();
        return Created(string.Empty, new { fb.Id, fb.CreatedAt });
    }
}

public record CreateFeedbackRequest(FeedbackType Type, string Subject, string Message, int? Rating);
