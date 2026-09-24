using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebServis.Data;
using WebServis.DTOs;
using WebServis.Helpers;
using WebServis.Models;

namespace WebServis.Controllers;

// Stok girişi (mal kabul): stok artar, alış fiyatı ve istenirse satış fiyatı güncellenir
[Route("api/stores/{storeId:guid}/purchases")]
public class PurchasesController(AppDbContext db) : BaseController(db)
{
    [HttpPost]
    public async Task<IActionResult> Create(Guid storeId, CreatePurchaseDto dto)
    {
        if (!await CanManageStoreAsync(storeId)) return Forbid();
        if (dto.Items.Count == 0) return BadRequest(new { message = "En az bir ürün ekleyin." });
        if (dto.Items.Any(i => i.Quantity <= 0 || i.UnitCost < 0 || i.SalePrice < 0))
            return BadRequest(new { message = "Miktar ve fiyatlar geçersiz." });

        Supplier? supplier = null;
        if (dto.SupplierId is not null)
        {
            supplier = await Db.Suppliers.FirstOrDefaultAsync(s => s.Id == dto.SupplierId && s.StoreId == storeId);
            if (supplier is null) return BadRequest(new { message = "Tedarikçi bulunamadı." });
        }

        var productIds = dto.Items.Select(i => i.ProductId).Distinct().ToList();
        var products = await Db.Products.Where(p => productIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id);
        if (products.Count != productIds.Count) return BadRequest(new { message = "Listede bilinmeyen ürün var." });

        await using var tx = await Db.Database.BeginTransactionAsync();
        var purchase = new Purchase
        {
            StoreId = storeId, Supplier = supplier, UserId = UserId,
            DocumentNo = string.IsNullOrWhiteSpace(dto.DocumentNo) ? null : dto.DocumentNo.Trim(),
            Note = string.IsNullOrWhiteSpace(dto.Note) ? null : dto.Note.Trim(),
        };
        var note = supplier is null ? "Stok girişi" : $"Stok girişi: {supplier.Name}";

        foreach (var item in dto.Items)
        {
            var product = products[item.ProductId];
            var sp = await StoreProductHelper.GetOrCreateAsync(Db, storeId, product.Id);
            StoreProductHelper.SetPrice(Db, sp, PriceType.Purchase, item.UnitCost, UserId, note);
            if (item.SalePrice is not null)
                StoreProductHelper.SetPrice(Db, sp, PriceType.Sale, item.SalePrice.Value, UserId, note);
            StoreProductHelper.MoveStock(Db, sp, StockMovementType.Purchase, item.Quantity, UserId, item.UnitCost,
                purchase.Id, purchase.DocumentNo);

            purchase.Items.Add(new PurchaseItem
            {
                StoreProduct = sp, Barcode = product.Barcode, ProductName = product.Name,
                Quantity = item.Quantity, UnitCost = item.UnitCost,
                LineTotal = Math.Round(item.Quantity * item.UnitCost, 2),
            });
        }

        purchase.TotalAmount = purchase.Items.Sum(i => i.LineTotal);
        Db.Purchases.Add(purchase);
        await Db.SaveChangesAsync();
        await tx.CommitAsync();
        return Ok(ToDto(purchase));
    }

    [HttpGet]
    public async Task<IActionResult> List(Guid storeId, [FromQuery] Guid? supplierId, [FromQuery] int page = 1,
        [FromQuery] int pageSize = 30)
    {
        if (!await HasStoreAccessAsync(storeId)) return Forbid();
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = Db.Purchases.AsNoTracking().Where(p => p.StoreId == storeId);
        if (supplierId is not null) query = query.Where(p => p.SupplierId == supplierId);
        var total = await query.CountAsync();
        var purchases = await query
            .Include(p => p.Supplier).Include(p => p.Items).ThenInclude(i => i.StoreProduct)
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync();
        return Ok(new PagedResult<PurchaseDto>(purchases.Select(ToDto).ToList(), total, page, pageSize));
    }

    [HttpGet("{purchaseId:guid}")]
    public async Task<IActionResult> Detail(Guid storeId, Guid purchaseId)
    {
        if (!await HasStoreAccessAsync(storeId)) return Forbid();
        var purchase = await Db.Purchases.AsNoTracking()
            .Include(p => p.Supplier).Include(p => p.Items).ThenInclude(i => i.StoreProduct)
            .FirstOrDefaultAsync(p => p.Id == purchaseId && p.StoreId == storeId);
        return purchase is null ? NotFound() : Ok(ToDto(purchase));
    }

    private static PurchaseDto ToDto(Purchase p) => new(
        p.Id, p.SupplierId, p.Supplier?.Name, p.DocumentNo, p.Note, p.TotalAmount, p.CreatedAt, p.Items.Count,
        p.Items.Select(i => new PurchaseItemDto(
            i.StoreProduct.ProductId, i.Barcode, i.ProductName, i.Quantity, i.UnitCost, i.LineTotal)).ToList());
}
