using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MobileServis.Data;
using MobileServis.DTOs;
using MobileServis.Models;

namespace MobileServis.Controllers;

[Route("api/buildings/{buildingId}/tenders")]
public class TendersController(AppDbContext db) : BaseController(db)
{
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid buildingId,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        [FromQuery] TenderStatus? status = null)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var q = Db.Tenders.Where(t => t.BuildingId == buildingId);
        if (status.HasValue) q = q.Where(t => t.Status == status.Value);
        var total = await q.CountAsync();
        var data = await q.OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(t => new MobileTenderDto(t.Id, t.Title, t.Description, t.Deadline, t.Status, t.Offers.Count, t.CreatedAt))
            .ToListAsync();
        return Ok(new PagedResult<MobileTenderDto>(data, total, page, pageSize));
    }

    [HttpPost("{id}/offers")]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public async Task<IActionResult> SubmitOffer(Guid buildingId, Guid id, CreateOfferDto dto)
    {
        var tender = await Db.Tenders.FirstOrDefaultAsync(t => t.Id == id && t.BuildingId == buildingId && t.Status == TenderStatus.Open);
        if (tender is null) return NotFound("İhale bulunamadı veya kapalı.");
        var offer = new TenderOffer
        {
            TenderId = id,
            CompanyName = dto.CompanyName, ContactEmail = dto.ContactEmail,
            ContactPhone = dto.ContactPhone, Amount = dto.Amount, Description = dto.Description
        };
        Db.TenderOffers.Add(offer);
        await Db.SaveChangesAsync();
        return Created(string.Empty, offer.Id);
    }
}
