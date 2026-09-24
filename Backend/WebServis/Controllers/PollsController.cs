using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebServis.Data;
using WebServis.DTOs;
using WebServis.Models;

namespace WebServis.Controllers;

[Route("api/buildings/{buildingId}/polls")]
public class PollsController(AppDbContext db) : BaseController(db)
{
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid buildingId)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var polls = await Db.Polls
            .Include(p => p.Options).ThenInclude(o => o.Votes)
            .Where(p => p.BuildingId == buildingId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
        return Ok(polls.Select(MapPoll));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(Guid buildingId, Guid id)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var poll = await Db.Polls
            .Include(p => p.Options).ThenInclude(o => o.Votes)
            .FirstOrDefaultAsync(p => p.Id == id && p.BuildingId == buildingId);
        if (poll is null) return NotFound();
        return Ok(MapPoll(poll));
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid buildingId, CreatePollDto dto)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var poll = new Poll
        {
            BuildingId = buildingId,
            Question = dto.Question,
            Description = dto.Description,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            CreatedByUserId = UserId,
            Options = dto.Options.Select((text, i) => new PollOption { Text = text, OrderIndex = i }).ToList()
        };
        Db.Polls.Add(poll);
        await Db.SaveChangesAsync();
        return Created(string.Empty, MapPoll(poll));
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

    private static PollDto MapPoll(Poll p)
    {
        var isActive = p.StartDate <= DateTime.UtcNow && p.EndDate >= DateTime.UtcNow;
        var options = p.Options.OrderBy(o => o.OrderIndex)
            .Select(o => new PollOptionDto(o.Id, o.Text, o.Votes?.Count ?? 0)).ToList();
        return new PollDto(p.Id, p.BuildingId, p.Question, p.Description, p.StartDate, p.EndDate, isActive, options, options.Sum(o => o.VoteCount), p.CreatedAt);
    }
}
