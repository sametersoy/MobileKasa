using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MobileServis.Data;
using MobileServis.DTOs;
using MobileServis.Models;

namespace MobileServis.Controllers;

[Route("api/buildings/{buildingId}/polls")]
public class PollsController(AppDbContext db) : BaseController(db)
{
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid buildingId,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var now = DateTime.UtcNow;
        var polls = await Db.Polls
            .Include(p => p.Options).ThenInclude(o => o.Votes)
            .Include(p => p.Votes)
            .Where(p => p.BuildingId == buildingId)
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync();
        var total = await Db.Polls.CountAsync(p => p.BuildingId == buildingId);
        var data = polls.Select(p => MapPoll(p, UserId)).ToList();
        return Ok(new PagedResult<MobilePollDto>(data, total, page, pageSize));
    }

    [HttpPost("{id}/vote")]
    public async Task<IActionResult> Vote(Guid buildingId, Guid id, VoteDto dto)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var poll = await Db.Polls.Include(p => p.Options)
            .FirstOrDefaultAsync(p => p.Id == id && p.BuildingId == buildingId);
        if (poll is null) return NotFound();
        if (poll.EndDate < DateTime.UtcNow) return BadRequest("Anket sona erdi.");
        if (!poll.Options.Any(o => o.Id == dto.PollOptionId)) return BadRequest("Geçersiz seçenek.");
        if (await Db.PollVotes.AnyAsync(v => v.PollId == id && v.UserId == UserId))
            return Conflict("Zaten oy kullandınız.");
        Db.PollVotes.Add(new PollVote { PollId = id, PollOptionId = dto.PollOptionId, UserId = UserId });
        await Db.SaveChangesAsync();
        return NoContent();
    }

    private static MobilePollDto MapPoll(Poll p, Guid userId)
    {
        var now = DateTime.UtcNow;
        var userVoted = p.Votes.Any(v => v.UserId == userId);
        var options = p.Options.OrderBy(o => o.OrderIndex)
            .Select(o => new MobilePollOptionDto(o.Id, o.Text, o.Votes?.Count ?? 0)).ToList();
        return new MobilePollDto(p.Id, p.Question, p.EndDate, p.StartDate <= now && p.EndDate >= now, userVoted, options);
    }
}
