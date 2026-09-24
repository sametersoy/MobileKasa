using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MobileServis.Data;
using MobileServis.DTOs;

namespace MobileServis.Controllers;

[Route("api/dashboard")]
public class DashboardController(AppDbContext db) : BaseController(db)
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var buildingIds = await Db.Buildings
            .Where(b => b.IsActive && (b.CreatedByUserId == UserId || b.Members.Any(m => m.UserId == UserId)))
            .Select(b => b.Id).ToListAsync();

        var buildings = await Db.Buildings
            .Include(b => b.Units)
            .Include(b => b.Notifications)
            .Include(b => b.Dues)
            .Where(b => b.IsActive && buildingIds.Contains(b.Id))
            .ToListAsync();

        var now = DateTime.UtcNow;
        var pollCounts = await Db.Polls
            .Where(p => buildingIds.Contains(p.BuildingId) && p.EndDate > now)
            .GroupBy(p => p.BuildingId)
            .Select(g => new { BuildingId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(g => g.BuildingId, g => g.Count);

        var summaries = buildings.Select(b => new BuildingSummaryDto(
            b.Id, b.Name, b.Address, b.Type.ToString(),
            b.Units.Count,
            b.Dues.Count(d => !d.IsPaid),
            b.Notifications.Count(n => !n.IsRead && (n.TargetUserId == null || n.TargetUserId == UserId)),
            pollCounts.GetValueOrDefault(b.Id, 0)
        )).ToList();

        var recentTransactions = buildingIds.Count > 0
            ? await Db.FinancialTransactions
                .Where(t => buildingIds.Contains(t.BuildingId))
                .OrderByDescending(t => t.Date)
                .Take(10)
                .Select(t => new MobileTransactionDto(t.Id, t.Type, t.Amount, t.Category, t.Description, t.Date))
                .ToListAsync()
            : new List<MobileTransactionDto>();

        return Ok(new DashboardDto(
            summaries,
            summaries.Sum(s => s.UnreadNotificationCount),
            summaries.Sum(s => s.UnpaidDuesCount),
            await Db.Polls.CountAsync(p => buildingIds.Contains(p.BuildingId) && p.EndDate > now),
            await Db.Tenders.CountAsync(t => buildingIds.Contains(t.BuildingId) && t.Status == Models.TenderStatus.Open),
            recentTransactions
        ));
    }
}
