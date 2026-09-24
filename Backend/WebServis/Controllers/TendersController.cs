using Microsoft.AspNetCore.Mvc;
using WebServis.Helpers;
using Microsoft.EntityFrameworkCore;
using WebServis.Data;
using WebServis.DTOs;
using WebServis.Models;

namespace WebServis.Controllers;

[Route("api/buildings/{buildingId}/tenders")]
public class TendersController(AppDbContext db) : BaseController(db)
{
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid buildingId)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var list = await Db.Tenders
            .Where(t => t.BuildingId == buildingId)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new TenderDto(t.Id, t.BuildingId, t.Title, t.Description, t.Deadline, t.Status, t.Offers.Count, t.CreatedAt))
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(Guid buildingId, Guid id)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var t = await Db.Tenders.Include(x => x.Offers).FirstOrDefaultAsync(x => x.Id == id && x.BuildingId == buildingId);
        if (t is null) return NotFound();
        return Ok(new
        {
            tender = new TenderDto(t.Id, t.BuildingId, t.Title, t.Description, t.Deadline, t.Status, t.Offers.Count, t.CreatedAt),
            offers = t.Offers.Select(o => new OfferDto(o.Id, o.TenderId, o.CompanyName, MaskHelper.MaskEmail(o.ContactEmail), MaskHelper.MaskPhone(o.ContactPhone), o.Amount, o.Description, o.IsAwarded, o.SubmittedAt))
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid buildingId, CreateTenderDto dto)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var tender = new Tender
        {
            BuildingId = buildingId,
            Title = dto.Title,
            Description = dto.Description,
            Deadline = dto.Deadline,
            CreatedByUserId = UserId
        };
        Db.Tenders.Add(tender);
        await Db.SaveChangesAsync();
        return Created(string.Empty, new TenderDto(tender.Id, tender.BuildingId, tender.Title, tender.Description, tender.Deadline, tender.Status, 0, tender.CreatedAt));
    }

    [HttpPatch("{id}/close")]
    public async Task<IActionResult> Close(Guid buildingId, Guid id)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var tender = await Db.Tenders.FirstOrDefaultAsync(t => t.Id == id && t.BuildingId == buildingId);
        if (tender is null) return NotFound();
        tender.Status = TenderStatus.Closed;
        await Db.SaveChangesAsync();
        return NoContent();
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
            CompanyName = dto.CompanyName,
            ContactEmail = dto.ContactEmail,
            ContactPhone = dto.ContactPhone,
            Amount = dto.Amount,
            Description = dto.Description
        };
        Db.TenderOffers.Add(offer);
        await Db.SaveChangesAsync();
        return Created(string.Empty, new OfferDto(offer.Id, offer.TenderId, offer.CompanyName, MaskHelper.MaskEmail(offer.ContactEmail), MaskHelper.MaskPhone(offer.ContactPhone), offer.Amount, offer.Description, offer.IsAwarded, offer.SubmittedAt));
    }

    [HttpPatch("{id}/offers/{offerId}/award")]
    public async Task<IActionResult> Award(Guid buildingId, Guid id, Guid offerId)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var tender = await Db.Tenders.Include(t => t.Offers).FirstOrDefaultAsync(t => t.Id == id && t.BuildingId == buildingId);
        if (tender is null) return NotFound();
        foreach (var o in tender.Offers) o.IsAwarded = o.Id == offerId;
        tender.Status = TenderStatus.Awarded;
        await Db.SaveChangesAsync();
        return NoContent();
    }
}
