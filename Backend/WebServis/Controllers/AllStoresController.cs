using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebServis.Data;
using WebServis.DTOs;
using WebServis.Models;

namespace WebServis.Controllers;

// "Tüm şubeler" görünümü: kullanıcının üye olduğu aktif şubelerin birleşik ürün ve satış verisi
[Route("api/stores/all")]
public class AllStoresController(AppDbContext db) : BaseController(db)
{
    private IQueryable<Guid> MyStoreIds =>
        Db.StoreMembers.Where(m => m.UserId == UserId && m.Store.IsActive).Select(m => m.StoreId);

    [HttpGet("products")]
    public async Task<IActionResult> Products([FromQuery] string? q, [FromQuery] bool lowStock = false,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 30)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var storeIds = MyStoreIds;
        var term = q?.Trim();

        var storeProducts = Db.StoreProducts.AsNoTracking()
            .Where(x => storeIds.Contains(x.StoreId) && x.IsActive);
        if (!string.IsNullOrEmpty(term))
            storeProducts = storeProducts.Where(x => x.Product.Barcode.StartsWith(term)
                || EF.Functions.ILike(x.Product.Name, $"%{term}%")
                || (x.Product.Brand != null && EF.Functions.ILike(x.Product.Brand, $"%{term}%")));

        var grouped = storeProducts
            .GroupBy(x => x.ProductId)
            .Select(g => new
            {
                ProductId = g.Key,
                Stock = g.Sum(x => x.StockQuantity),
                MinPrice = g.Min(x => x.SalePrice),
                MaxPrice = g.Max(x => x.SalePrice),
                StoreCount = g.Count(),
                LowCount = g.Sum(x => x.StockQuantity <= (x.MinStockLevel ?? 0) ? 1 : 0),
            });
        if (lowStock) grouped = grouped.Where(g => g.LowCount > 0);

        var ordered = grouped.Join(Db.Products, g => g.ProductId, p => p.Id, (g, p) => new { g, p.Name });
        var total = await ordered.CountAsync();
        var rows = await ordered.OrderBy(x => x.Name)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(x => x.g)
            .ToListAsync();

        var ids = rows.Select(r => r.ProductId).ToList();
        var products = await Db.Products.AsNoTracking().Include(p => p.Category)
            .Where(p => ids.Contains(p.Id)).ToDictionaryAsync(p => p.Id);

        var items = rows.Select(r =>
        {
            var p = products[r.ProductId];
            return new AllStoresProductDto(p.Id, p.Barcode, p.Name, p.Brand, p.Quantity, p.ImageUrl, p.Category?.Name,
                r.MinPrice, r.MaxPrice, r.Stock, r.StoreCount, r.LowCount > 0);
        }).ToList();
        return Ok(new PagedResult<AllStoresProductDto>(items, total, page, pageSize));
    }

    // Ürünün her şubedeki fiyatı ve stoğu (ürün o şubede hiç yoksa fiyat boş, stok 0)
    [HttpGet("products/{productId:guid}")]
    public async Task<IActionResult> ProductBranches(Guid productId)
    {
        var stores = await Db.StoreMembers.AsNoTracking()
            .Where(m => m.UserId == UserId && m.Store.IsActive)
            .OrderBy(m => m.JoinedAt)
            .Select(m => new { m.Store.Id, m.Store.Name })
            .ToListAsync();
        var storeIds = stores.Select(s => s.Id).ToList();
        var storeProducts = await Db.StoreProducts.AsNoTracking()
            .Where(x => x.ProductId == productId && storeIds.Contains(x.StoreId))
            .ToDictionaryAsync(x => x.StoreId);

        return Ok(stores.Select(s =>
        {
            var sp = storeProducts.GetValueOrDefault(s.Id);
            return new ProductBranchDto(s.Id, s.Name, sp?.SalePrice, sp?.PurchasePrice, sp?.StockQuantity ?? 0, sp?.MinStockLevel);
        }));
    }

    [HttpGet("sales")]
    public async Task<IActionResult> Sales([FromQuery] DateTime? from, [FromQuery] DateTime? to,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 30)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var query = FilterSales(from, to);
        var total = await query.CountAsync();
        var sales = await query
            .Include(s => s.Store).Include(s => s.Items).ThenInclude(i => i.StoreProduct)
            .OrderByDescending(s => s.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .AsNoTracking().ToListAsync();
        return Ok(new PagedResult<SaleDto>(sales.Select(SalesController.ToDto).ToList(), total, page, pageSize));
    }

    [HttpGet("sales/summary")]
    public async Task<IActionResult> SalesSummary([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var byStore = await FilterSales(from, to)
            .GroupBy(s => new { s.StoreId, s.Store.Name })
            .Select(g => new
            {
                g.Key.StoreId,
                g.Key.Name,
                Count = g.Count(),
                Total = g.Sum(s => s.TotalAmount),
                Vat = g.Sum(s => s.VatAmount),
                Cash = g.Where(s => s.PaymentMethod == PaymentMethod.Cash).Sum(s => s.TotalAmount),
                Card = g.Where(s => s.PaymentMethod == PaymentMethod.Card).Sum(s => s.TotalAmount),
            })
            .OrderByDescending(x => x.Total)
            .ToListAsync();

        return Ok(new SalesSummaryDto(
            byStore.Sum(x => x.Count), byStore.Sum(x => x.Total), byStore.Sum(x => x.Vat),
            byStore.Sum(x => x.Cash), byStore.Sum(x => x.Card),
            byStore.Select(x => new StoreSalesSummaryDto(x.StoreId, x.Name, x.Count, x.Total)).ToList()));
    }

    private IQueryable<Sale> FilterSales(DateTime? from, DateTime? to)
    {
        var storeIds = MyStoreIds;
        var query = Db.Sales.Where(s => storeIds.Contains(s.StoreId));
        if (from is not null) query = query.Where(s => s.CreatedAt >= from.Value.ToUniversalTime());
        if (to is not null) query = query.Where(s => s.CreatedAt < to.Value.ToUniversalTime());
        return query;
    }
}
