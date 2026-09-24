using Microsoft.AspNetCore.Mvc;
using WebServis.Helpers;
using Microsoft.EntityFrameworkCore;
using WebServis.Data;
using WebServis.DTOs;
using WebServis.Models;

namespace WebServis.Controllers;

[Route("api/buildings/{buildingId}/financial")]
public class FinancialController(AppDbContext db) : BaseController(db)
{
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid buildingId, [FromQuery] int? year, [FromQuery] int? month)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var q = Db.FinancialTransactions.Where(t => t.BuildingId == buildingId);
        if (year.HasValue) q = q.Where(t => t.Date.Year == year.Value);
        if (month.HasValue) q = q.Where(t => t.Date.Month == month.Value);

        var list = await q.OrderByDescending(t => t.Date)
            .Select(t => new
            {
                t.Id, t.BuildingId, t.UnitId, t.ResidentUserId,
                t.Type, t.Amount, t.Category, t.Description, t.Date, t.CreatedAt,
                UnitNumber = t.Unit != null ? t.Unit.Number : null
            })
            .ToListAsync();

        var residentIds = list.Where(t => t.ResidentUserId.HasValue).Select(t => t.ResidentUserId!.Value).Distinct().ToList();
        var residentNames = residentIds.Count > 0
            ? await Db.ResidentUsers.Where(u => residentIds.Contains(u.Id)).ToDictionaryAsync(u => u.Id, u => u.FullName)
            : new Dictionary<Guid, string>();

        var result = list.Select(t => new TransactionDto(
            t.Id, t.BuildingId, t.UnitId, t.UnitNumber,
            t.ResidentUserId, t.ResidentUserId.HasValue && residentNames.TryGetValue(t.ResidentUserId.Value, out var rn) ? rn : null,
            t.Type, t.Amount, t.Category, t.Description, t.Date, t.CreatedAt));

        return Ok(result);
    }

    [HttpGet("summary")]
    public async Task<IActionResult> Summary(Guid buildingId, [FromQuery] int? year)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var q = Db.FinancialTransactions.Where(t => t.BuildingId == buildingId);
        if (year.HasValue) q = q.Where(t => t.Date.Year == year.Value);
        var transactions = await q.ToListAsync();
        var income = transactions.Where(t => t.Type == TransactionType.Income).Sum(t => t.Amount);
        var expense = transactions.Where(t => t.Type == TransactionType.Expense).Sum(t => t.Amount);
        var byCategory = transactions
            .GroupBy(t => new { t.Category, t.Type })
            .Select(g => new CategorySummary(g.Key.Category, g.Key.Type, g.Sum(x => x.Amount)))
            .ToList();
        return Ok(new FinancialSummaryDto(income, expense, income - expense, byCategory));
    }

    [HttpGet("residents")]
    public async Task<IActionResult> GetResidents(Guid buildingId, [FromQuery] Guid? unitId)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var q = Db.ResidentUsers
            .Include(u => u.ResidentUnits)
            .Where(u => u.BuildingId == buildingId && u.Role == "sakin" && u.IsActive);
        if (unitId.HasValue)
            q = q.Where(u => u.ResidentUnits.Any(ru => ru.UnitId == unitId.Value));
        var residents = await q.OrderBy(u => u.FullName)
            .Select(u => new ResidentUserDto(u.Id, u.FullName, MaskHelper.MaskEmail(u.Email), u.ResidentUnits.Select(ru => ru.UnitId).ToList()))
            .ToListAsync();
        return Ok(residents);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid buildingId, CreateTransactionDto dto)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var t = new FinancialTransaction
        {
            BuildingId = buildingId,
            UnitId = dto.UnitId,
            ResidentUserId = dto.ResidentUserId,
            Type = dto.Type,
            Amount = dto.Amount,
            Category = dto.Category,
            Description = dto.Description,
            Date = dto.Date,
            CreatedByUserId = UserId
        };
        Db.FinancialTransactions.Add(t);
        await Db.SaveChangesAsync();

        string? unitNumber = dto.UnitId.HasValue
            ? await Db.Units.Where(u => u.Id == dto.UnitId.Value).Select(u => u.Number).FirstOrDefaultAsync()
            : null;
        string? residentName = dto.ResidentUserId.HasValue
            ? await Db.ResidentUsers.Where(u => u.Id == dto.ResidentUserId.Value).Select(u => u.FullName).FirstOrDefaultAsync()
            : null;

        return Created(string.Empty, new TransactionDto(
            t.Id, t.BuildingId, t.UnitId, unitNumber,
            t.ResidentUserId, residentName,
            t.Type, t.Amount, t.Category, t.Description, t.Date, t.CreatedAt));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid buildingId, Guid id)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var t = await Db.FinancialTransactions.FirstOrDefaultAsync(x => x.Id == id && x.BuildingId == buildingId);
        if (t is null) return NotFound();
        Db.FinancialTransactions.Remove(t);
        await Db.SaveChangesAsync();
        return NoContent();
    }
}
