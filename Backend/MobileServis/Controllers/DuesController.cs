using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MobileServis.Data;
using MobileServis.DTOs;

namespace MobileServis.Controllers;

[Route("api/buildings/{buildingId}/dues")]
public class DuesController(AppDbContext db) : BaseController(db)
{
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid buildingId,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 30,
        [FromQuery] bool? isPaid = null, [FromQuery] string? period = null)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var q = Db.Dues.Include(d => d.Unit).Where(d => d.BuildingId == buildingId);
        if (isPaid.HasValue) q = q.Where(d => d.IsPaid == isPaid.Value);
        if (period is not null) q = q.Where(d => d.Period == period);
        var total = await q.CountAsync();
        var data = await q.OrderBy(d => d.IsPaid).ThenBy(d => d.DueDate)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(d => new MobileDuesDto(d.Id, d.UnitId, d.Unit.Number, d.Period, d.Amount, d.DueDate, d.IsPaid, d.PaidDate))
            .ToListAsync();
        return Ok(new PagedResult<MobileDuesDto>(data, total, page, pageSize));
    }

    [HttpPatch("{duesId}/pay")]
    public async Task<IActionResult> Pay(Guid buildingId, Guid duesId, PayDuesDto dto)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var dues = await Db.Dues.FirstOrDefaultAsync(d => d.Id == duesId && d.BuildingId == buildingId);
        if (dues is null) return NotFound();
        dues.IsPaid = true;
        dues.PaidDate = dto.PaidDate;
        dues.Note = dto.Note;
        await Db.SaveChangesAsync();
        return NoContent();
    }
}
