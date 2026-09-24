using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebServis.Data;
using WebServis.DTOs;
using WebServis.Helpers;
using WebServis.Models;

namespace WebServis.Controllers;

[Route("api/stores/{storeId:guid}/sales")]
public class SalesController(AppDbContext db) : BaseController(db)
{
    [HttpPost]
    public async Task<IActionResult> Create(Guid storeId, CreateSaleDto dto)
    {
        if (!await HasStoreAccessAsync(storeId)) return Forbid();
        if (dto.Items.Count == 0) return BadRequest(new { message = "Sepet boş." });
        if (dto.Items.Any(i => i.Quantity <= 0 || i.UnitPrice < 0))
            return BadRequest(new { message = "Miktar ve fiyat geçersiz." });

        // Aynı ürün birden fazla satırda gelirse tek satırda birleştir
        var lines = dto.Items
            .GroupBy(i => i.ProductId)
            .Select(g => new SaleItemInput(g.Key, g.Sum(i => i.Quantity), g.Last().UnitPrice))
            .ToList();
        var productIds = lines.Select(l => l.ProductId).ToList();
        var products = await Db.Products.Where(p => productIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id);
        if (products.Count != productIds.Count) return BadRequest(new { message = "Sepette bilinmeyen ürün var." });

        await using var tx = await Db.Database.BeginTransactionAsync();
        var sale = new Sale { StoreId = storeId, CashierUserId = UserId, PaymentMethod = dto.PaymentMethod };

        foreach (var line in lines)
        {
            var product = products[line.ProductId];
            var sp = await StoreProductHelper.GetOrCreateAsync(Db, storeId, product.Id);
            StoreProductHelper.SetPrice(Db, sp, PriceType.Sale, line.UnitPrice, UserId, "Satış sırasında güncellendi");
            StoreProductHelper.MoveStock(Db, sp, StockMovementType.Sale, -line.Quantity, UserId, line.UnitPrice, sale.Id);

            sale.Items.Add(new SaleItem
            {
                StoreProduct = sp, Barcode = product.Barcode, ProductName = product.Name,
                Quantity = line.Quantity, UnitPrice = line.UnitPrice, VatRate = sp.VatRate,
                LineTotal = Math.Round(line.Quantity * line.UnitPrice, 2),
            });
        }

        // Raf fiyatları KDV dahil: KDV = tutar × oran / (100 + oran)
        sale.TotalAmount = sale.Items.Sum(i => i.LineTotal);
        sale.VatAmount = Math.Round(sale.Items.Sum(i => i.LineTotal * i.VatRate / (100 + i.VatRate)), 2);
        Db.Sales.Add(sale);

        await Db.SaveChangesAsync();
        await tx.CommitAsync();
        return Ok(ToDto(sale));
    }

    [HttpGet]
    public async Task<IActionResult> List(Guid storeId, [FromQuery] DateTime? from, [FromQuery] DateTime? to,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 30)
    {
        if (!await HasStoreAccessAsync(storeId)) return Forbid();
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = Filter(storeId, from, to);
        var total = await query.CountAsync();
        var sales = await query.Include(s => s.Items).ThenInclude(i => i.StoreProduct)
            .OrderByDescending(s => s.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .AsNoTracking().ToListAsync();
        return Ok(new PagedResult<SaleDto>(sales.Select(s => ToDto(s)).ToList(), total, page, pageSize));
    }

    [HttpGet("summary")]
    public async Task<IActionResult> Summary(Guid storeId, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        if (!await HasStoreAccessAsync(storeId)) return Forbid();
        var summary = await Filter(storeId, from, to)
            .GroupBy(_ => 1)
            .Select(g => new SalesSummaryDto(
                g.Count(),
                g.Sum(s => s.TotalAmount),
                g.Sum(s => s.VatAmount),
                g.Where(s => s.PaymentMethod == PaymentMethod.Cash).Sum(s => s.TotalAmount),
                g.Where(s => s.PaymentMethod == PaymentMethod.Card).Sum(s => s.TotalAmount),
                null))
            .FirstOrDefaultAsync();
        return Ok(summary ?? new SalesSummaryDto(0, 0, 0, 0, 0));
    }

    [HttpGet("{saleId:guid}")]
    public async Task<IActionResult> Detail(Guid storeId, Guid saleId)
    {
        if (!await HasStoreAccessAsync(storeId)) return Forbid();
        var sale = await Db.Sales.AsNoTracking().Include(s => s.Items).ThenInclude(i => i.StoreProduct)
            .FirstOrDefaultAsync(s => s.Id == saleId && s.StoreId == storeId);
        return sale is null ? NotFound() : Ok(ToDto(sale));
    }

    private IQueryable<Sale> Filter(Guid storeId, DateTime? from, DateTime? to)
    {
        var query = Db.Sales.Where(s => s.StoreId == storeId);
        if (from is not null) query = query.Where(s => s.CreatedAt >= from.Value.ToUniversalTime());
        if (to is not null) query = query.Where(s => s.CreatedAt < to.Value.ToUniversalTime());
        return query;
    }

    internal static SaleDto ToDto(Sale s) => new(
        s.Id, s.PaymentMethod, s.TotalAmount, s.VatAmount, s.CreatedAt, s.Items.Count,
        s.Items.Select(i => new SaleItemDto(
            i.StoreProduct.ProductId, i.Barcode, i.ProductName, i.Quantity, i.UnitPrice, i.LineTotal)).ToList(),
        s.StoreId, s.Store?.Name);
}
