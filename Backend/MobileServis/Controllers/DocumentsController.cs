using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MobileServis.Data;
using MobileServis.DTOs;

namespace MobileServis.Controllers;

[Route("api/buildings/{buildingId}/documents")]
public class DocumentsController(AppDbContext db) : BaseController(db)
{
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid buildingId,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var q = Db.Documents.Where(d => d.BuildingId == buildingId);
        var total = await q.CountAsync();
        var data = await q.OrderByDescending(d => d.UploadedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(d => new MobileDocumentDto(d.Id, d.Name, d.FileName, d.ContentType, d.FileSizeBytes, d.Category, d.UploadedAt))
            .ToListAsync();
        return Ok(new PagedResult<MobileDocumentDto>(data, total, page, pageSize));
    }

    [HttpGet("{id}/download")]
    public async Task<IActionResult> Download(Guid buildingId, Guid id)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var doc = await Db.Documents.FirstOrDefaultAsync(d => d.Id == id && d.BuildingId == buildingId);
        if (doc is null) return NotFound();
        if (!System.IO.File.Exists(doc.StoragePath)) return NotFound("Dosya bulunamadı.");
        var stream = System.IO.File.OpenRead(doc.StoragePath);
        return File(stream, doc.ContentType, doc.FileName);
    }
}
