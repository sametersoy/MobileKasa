using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebServis.Data;
using WebServis.DTOs;
using WebServis.Models;

namespace WebServis.Controllers;

[Route("api/stores/{storeId:guid}/suppliers")]
public class SuppliersController(AppDbContext db) : BaseController(db)
{
    [HttpGet]
    public async Task<IActionResult> List(Guid storeId, [FromQuery] string? q)
    {
        if (!await HasStoreAccessAsync(storeId)) return Forbid();
        var query = Db.Suppliers.AsNoTracking().Where(s => s.StoreId == storeId && s.IsActive);
        if (!string.IsNullOrWhiteSpace(q))
            query = query.Where(s => EF.Functions.ILike(s.Name, $"%{q.Trim()}%")
                                     || (s.ContactName != null && EF.Functions.ILike(s.ContactName, $"%{q.Trim()}%")));

        var suppliers = await query.OrderBy(s => s.Name)
            .Select(s => new SupplierDto(
                s.Id, s.Name, s.ContactName, s.Phone, s.Email, s.TaxNumber, s.Address, s.Note,
                Db.Purchases.Count(p => p.SupplierId == s.Id),
                Db.Purchases.Where(p => p.SupplierId == s.Id).Sum(p => (decimal?)p.TotalAmount) ?? 0))
            .ToListAsync();
        return Ok(suppliers);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid storeId, SaveSupplierDto dto)
    {
        if (!await CanManageStoreAsync(storeId)) return Forbid();
        if (string.IsNullOrWhiteSpace(dto.Name)) return BadRequest(new { message = "Tedarikçi adı zorunlu." });
        var supplier = new Supplier { StoreId = storeId };
        Apply(supplier, dto);
        Db.Suppliers.Add(supplier);
        await Db.SaveChangesAsync();
        return Ok(ToDto(supplier, 0, 0));
    }

    [HttpPut("{supplierId:guid}")]
    public async Task<IActionResult> Update(Guid storeId, Guid supplierId, SaveSupplierDto dto)
    {
        if (!await CanManageStoreAsync(storeId)) return Forbid();
        if (string.IsNullOrWhiteSpace(dto.Name)) return BadRequest(new { message = "Tedarikçi adı zorunlu." });
        var supplier = await Db.Suppliers.FirstOrDefaultAsync(s => s.Id == supplierId && s.StoreId == storeId);
        if (supplier is null) return NotFound();
        Apply(supplier, dto);
        await Db.SaveChangesAsync();
        var count = await Db.Purchases.CountAsync(p => p.SupplierId == supplierId);
        var total = await Db.Purchases.Where(p => p.SupplierId == supplierId).SumAsync(p => (decimal?)p.TotalAmount) ?? 0;
        return Ok(ToDto(supplier, count, total));
    }

    // Tedarikçi pasife alınır; geçmiş stok girişlerindeki bağlantısı korunur
    [HttpDelete("{supplierId:guid}")]
    public async Task<IActionResult> Deactivate(Guid storeId, Guid supplierId)
    {
        if (!await CanManageStoreAsync(storeId)) return Forbid();
        var supplier = await Db.Suppliers.FirstOrDefaultAsync(s => s.Id == supplierId && s.StoreId == storeId);
        if (supplier is null) return NotFound();
        supplier.IsActive = false;
        await Db.SaveChangesAsync();
        return NoContent();
    }

    private static void Apply(Supplier s, SaveSupplierDto dto)
    {
        s.Name = dto.Name.Trim();
        s.ContactName = Clean(dto.ContactName);
        s.Phone = Clean(dto.Phone);
        s.Email = Clean(dto.Email);
        s.TaxNumber = Clean(dto.TaxNumber);
        s.Address = Clean(dto.Address);
        s.Note = Clean(dto.Note);
    }

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static SupplierDto ToDto(Supplier s, int count, decimal total) => new(
        s.Id, s.Name, s.ContactName, s.Phone, s.Email, s.TaxNumber, s.Address, s.Note, count, total);
}
