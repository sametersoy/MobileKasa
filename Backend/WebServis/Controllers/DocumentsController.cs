using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebServis.Data;
using WebServis.DTOs;
using WebServis.Models;

namespace WebServis.Controllers;

[Route("api/buildings/{buildingId}/documents")]
public class DocumentsController(AppDbContext db) : BaseController(db)
{
    private static readonly string UploadPath = Path.Combine("/app", "uploads");

    [HttpGet]
    public async Task<IActionResult> GetAll(Guid buildingId, [FromQuery] Guid? unitId)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var q = Db.Documents.Where(d => d.BuildingId == buildingId);
        if (unitId.HasValue) q = q.Where(d => d.UnitId == unitId);
        var list = await q.OrderByDescending(d => d.UploadedAt)
            .Select(d => new DocumentDto(d.Id, d.BuildingId, d.UnitId, d.Name, d.FileName, d.ContentType, d.FileSizeBytes, d.Category, d.UploadedAt))
            .ToListAsync();
        return Ok(list);
    }

    [HttpPost]
    public async Task<IActionResult> Upload(Guid buildingId, IFormFile file,
        [FromForm] string name, [FromForm] DocumentCategory category, [FromForm] Guid? unitId)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        if (file.Length == 0) return BadRequest("Dosya boş.");
        Directory.CreateDirectory(UploadPath);
        var fileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
        var filePath = Path.Combine(UploadPath, fileName);
        await using (var stream = System.IO.File.Create(filePath))
            await file.CopyToAsync(stream);
        var doc = new Document
        {
            BuildingId = buildingId,
            UnitId = unitId,
            Name = name,
            FileName = file.FileName,
            ContentType = file.ContentType,
            FileSizeBytes = file.Length,
            StoragePath = filePath,
            Category = category,
            UploadedByUserId = UserId
        };
        Db.Documents.Add(doc);
        await Db.SaveChangesAsync();
        return Created(string.Empty, new DocumentDto(doc.Id, doc.BuildingId, doc.UnitId, doc.Name, doc.FileName, doc.ContentType, doc.FileSizeBytes, doc.Category, doc.UploadedAt));
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

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid buildingId, Guid id)
    {
        if (!await HasBuildingAccessAsync(buildingId)) return Forbid();
        var doc = await Db.Documents.FirstOrDefaultAsync(d => d.Id == id && d.BuildingId == buildingId);
        if (doc is null) return NotFound();
        if (System.IO.File.Exists(doc.StoragePath)) System.IO.File.Delete(doc.StoragePath);
        Db.Documents.Remove(doc);
        await Db.SaveChangesAsync();
        return NoContent();
    }
}
