using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MobileServis.Data;
using MobileServis.DTOs;
using MobileServis.Models;

namespace MobileServis.Controllers;

[Route("api/buildings/{buildingId}/financial")]
public class FinancialController(AppDbContext db) : BaseController(db)
{
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid buildingId,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 30,
        [FromQuery] TransactionType? type = null)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var q = Db.FinancialTransactions.Where(t => t.BuildingId == buildingId);
        if (type.HasValue) q = q.Where(t => t.Type == type.Value);
        var total = await q.CountAsync();
        var data = await q.OrderByDescending(t => t.Date)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(t => new MobileTransactionDto(t.Id, t.Type, t.Amount, t.Category, t.Description, t.Date))
            .ToListAsync();
        return Ok(new PagedResult<MobileTransactionDto>(data, total, page, pageSize));
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid buildingId, CreateTransactionDto dto)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var t = new FinancialTransaction
        {
            BuildingId = buildingId,
            Type = dto.Type, Amount = dto.Amount,
            Category = dto.Category, Description = dto.Description,
            Date = dto.Date, CreatedByUserId = UserId
        };
        Db.FinancialTransactions.Add(t);
        await Db.SaveChangesAsync();
        return Created(string.Empty, new MobileTransactionDto(t.Id, t.Type, t.Amount, t.Category, t.Description, t.Date));
    }
}
