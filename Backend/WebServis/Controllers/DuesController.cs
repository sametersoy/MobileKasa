using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebServis.Data;
using WebServis.DTOs;
using WebServis.Models;

namespace WebServis.Controllers;

[Route("api/buildings/{buildingId}/dues")]
public class DuesController(AppDbContext db) : BaseController(db)
{
    [HttpGet("rules")]
    public async Task<IActionResult> GetRules(Guid buildingId)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var rules = await Db.DuesRules.Where(r => r.BuildingId == buildingId)
            .Select(r => new DuesRuleDto(r.Id, r.BuildingId, r.Name, r.CalculationType, r.Amount, r.DayOfMonth, r.IsActive))
            .ToListAsync();
        return Ok(rules);
    }

    [HttpPost("rules")]
    public async Task<IActionResult> CreateRule(Guid buildingId, CreateDuesRuleDto dto)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var rule = new DuesRule
        {
            BuildingId = buildingId,
            Name = dto.Name,
            CalculationType = dto.CalculationType,
            Amount = dto.Amount,
            DayOfMonth = dto.DayOfMonth
        };
        Db.DuesRules.Add(rule);
        await Db.SaveChangesAsync();
        return Created(string.Empty, new DuesRuleDto(rule.Id, rule.BuildingId, rule.Name, rule.CalculationType, rule.Amount, rule.DayOfMonth, rule.IsActive));
    }

    [HttpDelete("rules/{ruleId}")]
    public async Task<IActionResult> DeleteRule(Guid buildingId, Guid ruleId)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var rule = await Db.DuesRules.FirstOrDefaultAsync(r => r.Id == ruleId && r.BuildingId == buildingId);
        if (rule is null) return NotFound();
        Db.DuesRules.Remove(rule);
        await Db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(Guid buildingId, [FromQuery] string? period, [FromQuery] bool? isPaid)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var q = Db.Dues.Include(d => d.Unit).Where(d => d.BuildingId == buildingId);
        if (period is not null) q = q.Where(d => d.Period == period);
        if (isPaid.HasValue) q = q.Where(d => d.IsPaid == isPaid.Value);
        var list = await q.OrderBy(d => d.Period).ThenBy(d => d.Unit.Number)
            .Select(d => new DuesDto(d.Id, d.UnitId, d.Unit.Number, d.Period, d.Amount, d.DueDate, d.PaidDate, d.IsPaid, d.Note))
            .ToListAsync();
        return Ok(list);
    }

    [HttpPost("generate")]
    public async Task<IActionResult> Generate(Guid buildingId, GenerateDuesDto dto)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var units = await Db.Units.Where(u => u.BuildingId == buildingId).ToListAsync();
        var rules = await Db.DuesRules.Where(r => r.BuildingId == buildingId && r.IsActive).ToListAsync();
        if (!rules.Any()) return BadRequest("Aktif aidat kuralı bulunamadı.");
        var created = new List<Dues>();
        foreach (var unit in units)
        {
            if (await Db.Dues.AnyAsync(d => d.UnitId == unit.Id && d.Period == dto.Period)) continue;
            decimal amount = rules.Sum(r => r.CalculationType == DuesCalculationType.PerSquareMeter
                ? r.Amount * unit.AreaM2
                : r.Amount);
            created.Add(new Dues
            {
                BuildingId = buildingId,
                UnitId = unit.Id,
                Period = dto.Period,
                Amount = amount,
                DueDate = dto.DueDate
            });
        }
        Db.Dues.AddRange(created);
        await Db.SaveChangesAsync();
        return Ok(new { generated = created.Count });
    }

    [HttpPatch("{duesId}/pay")]
    public async Task<IActionResult> Pay(Guid buildingId, Guid duesId, PayDuesDto dto)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var dues = await Db.Dues.Include(d => d.Unit).FirstOrDefaultAsync(d => d.Id == duesId && d.BuildingId == buildingId);
        if (dues is null) return NotFound();

        if (!dues.IsPaid)
        {
            dues.IsPaid = true;
            dues.PaidDate = dto.PaidDate;
            dues.Note = dto.Note;

            var existing = await Db.FinancialTransactions.FirstOrDefaultAsync(t => t.DuesId == duesId);
            if (existing is null)
            {
                Db.FinancialTransactions.Add(new FinancialTransaction
                {
                    BuildingId = buildingId,
                    UnitId = dues.UnitId,
                    Type = TransactionType.Income,
                    Amount = dues.Amount,
                    Category = "Aidat",
                    Description = $"{dues.Period} dönemi aidat — Daire {dues.Unit.Number}",
                    Date = dto.PaidDate,
                    DuesId = duesId,
                    CreatedByUserId = UserId
                });
            }

            await Db.SaveChangesAsync();
        }

        return NoContent();
    }

    [HttpPatch("{duesId}/unpay")]
    public async Task<IActionResult> Unpay(Guid buildingId, Guid duesId)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var dues = await Db.Dues.FirstOrDefaultAsync(d => d.Id == duesId && d.BuildingId == buildingId);
        if (dues is null) return NotFound();
        dues.IsPaid = false;
        dues.PaidDate = null;
        var tx = await Db.FinancialTransactions.FirstOrDefaultAsync(t => t.DuesId == duesId);
        if (tx is not null) Db.FinancialTransactions.Remove(tx);
        await Db.SaveChangesAsync();
        return NoContent();
    }
}
