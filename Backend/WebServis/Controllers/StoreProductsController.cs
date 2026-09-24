using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebServis.Data;
using WebServis.DTOs;
using WebServis.Helpers;
using WebServis.Models;

namespace WebServis.Controllers;

[Route("api/stores/{storeId:guid}/products")]
public class StoreProductsController(AppDbContext db) : BaseController(db)
{
    // scope=store: mağazada fiyatı/stoğu olan ürünler; scope=catalog: tüm katalogda arama (q en az 2 karakter)
    [HttpGet]
    public async Task<IActionResult> List(Guid storeId, [FromQuery] string? q, [FromQuery] string scope = "store",
        [FromQuery] bool lowStock = false, [FromQuery] int page = 1, [FromQuery] int pageSize = 30)
    {
        if (!await HasStoreAccessAsync(storeId)) return Forbid();
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var term = q?.Trim();

        if (scope == "catalog")
        {
            if (string.IsNullOrEmpty(term) || term.Length < 2)
                return Ok(new PagedResult<ProductLookupDto>([], 0, page, pageSize));

            var catalog = Db.Products.AsNoTracking().Include(p => p.Category)
                .Where(p => p.Barcode.StartsWith(term) || EF.Functions.ILike(p.Name, $"%{term}%")
                            || (p.Brand != null && EF.Functions.ILike(p.Brand, $"%{term}%")));
            var total = await catalog.CountAsync();
            var products = await catalog.OrderBy(p => p.Name)
                .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
            var ids = products.Select(p => p.Id).ToList();
            var storeProducts = await Db.StoreProducts.AsNoTracking()
                .Where(x => x.StoreId == storeId && ids.Contains(x.ProductId))
                .ToDictionaryAsync(x => x.ProductId);
            return Ok(new PagedResult<ProductLookupDto>(
                products.Select(p => StoreProductHelper.ToLookup(p, storeProducts.GetValueOrDefault(p.Id))).ToList(),
                total, page, pageSize));
        }

        var query = Db.StoreProducts.AsNoTracking()
            .Include(x => x.Product).ThenInclude(p => p.Category)
            .Where(x => x.StoreId == storeId && x.IsActive);
        if (!string.IsNullOrEmpty(term))
            query = query.Where(x => x.Product.Barcode.StartsWith(term) || EF.Functions.ILike(x.Product.Name, $"%{term}%")
                                     || (x.Product.Brand != null && EF.Functions.ILike(x.Product.Brand, $"%{term}%")));
        if (lowStock)
            query = query.Where(x => x.StockQuantity <= (x.MinStockLevel ?? 0));

        var count = await query.CountAsync();
        var items = await query.OrderBy(x => x.Product.Name)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return Ok(new PagedResult<ProductLookupDto>(
            items.Select(x => StoreProductHelper.ToLookup(x.Product, x)).ToList(), count, page, pageSize));
    }

    [HttpGet("by-barcode/{barcode}")]
    public async Task<IActionResult> ByBarcode(Guid storeId, string barcode)
    {
        if (!await HasStoreAccessAsync(storeId)) return Forbid();

        var product = await Db.Products.Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Barcode == barcode.Trim());
        if (product is null) return NotFound(new { message = "Bu barkod katalogda yok." });

        var sp = await Db.StoreProducts
            .FirstOrDefaultAsync(x => x.StoreId == storeId && x.ProductId == product.Id);
        return Ok(StoreProductHelper.ToLookup(product, sp));
    }

    // Katalogda olmayan bir barkodu mağazanın kendi ürünü olarak ekler
    [HttpPost]
    public async Task<IActionResult> Create(Guid storeId, CreateStoreProductDto dto)
    {
        if (!await HasStoreAccessAsync(storeId)) return Forbid();
        var barcode = dto.Barcode.Trim();
        if (string.IsNullOrEmpty(barcode) || string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest(new { message = "Barkod ve ürün adı zorunlu." });
        if (await Db.Products.AnyAsync(p => p.Barcode == barcode))
            return Conflict(new { message = "Bu barkod zaten katalogda var." });

        var product = new Product
        {
            Barcode = barcode,
            Name = dto.Name.Trim(),
            Brand = string.IsNullOrWhiteSpace(dto.Brand) ? null : dto.Brand.Trim(),
            Source = ProductSource.Manual,
            CreatedByStoreId = storeId,
        };
        Db.Products.Add(product);

        var sp = new StoreProduct { StoreId = storeId, Product = product };
        Db.StoreProducts.Add(sp);
        if (dto.SalePrice is > 0)
            StoreProductHelper.SetPrice(Db, sp, PriceType.Sale, dto.SalePrice.Value, UserId, "Ürün oluşturuldu");

        await Db.SaveChangesAsync();
        return Ok(StoreProductHelper.ToLookup(product, sp));
    }

    [HttpGet("{productId:guid}")]
    public async Task<IActionResult> Detail(Guid storeId, Guid productId)
    {
        if (!await HasStoreAccessAsync(storeId)) return Forbid();
        var product = await Db.Products.AsNoTracking().Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Id == productId);
        if (product is null) return NotFound();

        var sp = await Db.StoreProducts.AsNoTracking()
            .FirstOrDefaultAsync(x => x.StoreId == storeId && x.ProductId == productId);

        List<PriceHistoryDto> prices = [];
        List<StockMovementDto> movements = [];
        var stats = new ProductSalesStatsDto(30, 0, 0);
        if (sp is not null)
        {
            prices = await Db.ProductPriceHistory.AsNoTracking()
                .Where(h => h.StoreProductId == sp.Id)
                .OrderByDescending(h => h.ChangedAt).Take(50)
                .Select(h => new PriceHistoryDto(h.Type, h.OldPrice, h.NewPrice, h.Note, h.ChangedAt))
                .ToListAsync();
            movements = await Db.StockMovements.AsNoTracking()
                .Where(m => m.StoreProductId == sp.Id)
                .OrderByDescending(m => m.CreatedAt).Take(50)
                .Select(m => new StockMovementDto(m.Type, m.Quantity, m.BalanceAfter, m.UnitPrice, m.Note, m.CreatedAt))
                .ToListAsync();
            var since = DateTime.UtcNow.AddDays(-30);
            var sold = await Db.SaleItems.AsNoTracking()
                .Where(i => i.StoreProductId == sp.Id && i.Sale.CreatedAt >= since)
                .GroupBy(_ => 1)
                .Select(g => new { Quantity = g.Sum(i => i.Quantity), Revenue = g.Sum(i => i.LineTotal) })
                .FirstOrDefaultAsync();
            if (sold is not null) stats = new ProductSalesStatsDto(30, sold.Quantity, sold.Revenue);
        }

        return Ok(new ProductDetailDto(StoreProductHelper.ToLookup(product, sp), prices, movements, stats));
    }

    [HttpPut("{productId:guid}")]
    public async Task<IActionResult> Update(Guid storeId, Guid productId, UpdateStoreProductDto dto)
    {
        if (!await CanManageStoreAsync(storeId)) return Forbid();
        if (dto.SalePrice < 0 || dto.PurchasePrice < 0 || dto.MinStockLevel < 0 || dto.VatRate is < 0 or > 100)
            return BadRequest(new { message = "Değerler geçersiz." });
        var product = await Db.Products.Include(p => p.Category).FirstOrDefaultAsync(p => p.Id == productId);
        if (product is null) return NotFound();

        var sp = await StoreProductHelper.GetOrCreateAsync(Db, storeId, productId);
        if (dto.SalePrice is not null)
            StoreProductHelper.SetPrice(Db, sp, PriceType.Sale, dto.SalePrice.Value, UserId, "Ürün kartından güncellendi");
        if (dto.PurchasePrice is not null)
            StoreProductHelper.SetPrice(Db, sp, PriceType.Purchase, dto.PurchasePrice.Value, UserId, "Ürün kartından güncellendi");
        if (dto.VatRate is not null) sp.VatRate = dto.VatRate.Value;
        sp.MinStockLevel = dto.MinStockLevel;
        sp.UpdatedAt = DateTime.UtcNow;

        await Db.SaveChangesAsync();
        return Ok(StoreProductHelper.ToLookup(product, sp));
    }

    [HttpPost("{productId:guid}/stock-adjustments")]
    public async Task<IActionResult> AdjustStock(Guid storeId, Guid productId, StockAdjustmentDto dto)
    {
        if (!await CanManageStoreAsync(storeId)) return Forbid();
        var product = await Db.Products.Include(p => p.Category).FirstOrDefaultAsync(p => p.Id == productId);
        if (product is null) return NotFound();

        var sp = await StoreProductHelper.GetOrCreateAsync(Db, storeId, productId);
        decimal delta;
        switch (dto.Type)
        {
            case StockMovementType.Adjustment when dto.CountedQuantity is >= 0:
                delta = dto.CountedQuantity.Value - sp.StockQuantity;
                break;
            case StockMovementType.Waste when dto.Quantity is > 0:
                delta = -dto.Quantity.Value;
                break;
            case StockMovementType.Return when dto.Quantity is > 0:
                delta = dto.Quantity.Value;
                break;
            default:
                return BadRequest(new { message = "Geçersiz stok işlemi." });
        }
        if (delta == 0) return Ok(StoreProductHelper.ToLookup(product, sp));

        StoreProductHelper.MoveStock(Db, sp, dto.Type, delta, UserId, note: dto.Note);
        await Db.SaveChangesAsync();
        return Ok(StoreProductHelper.ToLookup(product, sp));
    }
}
