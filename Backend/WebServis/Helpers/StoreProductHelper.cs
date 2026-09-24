using Microsoft.EntityFrameworkCore;
using WebServis.Data;
using WebServis.DTOs;
using WebServis.Models;

namespace WebServis.Helpers;

// Mağaza ürünü üzerindeki fiyat ve stok değişikliklerinin tek noktası: her değişiklik geçmişe yazılır
public static class StoreProductHelper
{
    public static async Task<StoreProduct> GetOrCreateAsync(AppDbContext db, Guid storeId, Guid productId)
    {
        var sp = db.StoreProducts.Local.FirstOrDefault(x => x.StoreId == storeId && x.ProductId == productId)
            ?? await db.StoreProducts.FirstOrDefaultAsync(x => x.StoreId == storeId && x.ProductId == productId);
        if (sp is null)
        {
            sp = new StoreProduct { StoreId = storeId, ProductId = productId };
            db.StoreProducts.Add(sp);
        }
        return sp;
    }

    public static void SetPrice(AppDbContext db, StoreProduct sp, PriceType type, decimal newPrice, Guid userId,
        string? note = null)
    {
        var current = type == PriceType.Sale ? sp.SalePrice : sp.PurchasePrice;
        if (current == newPrice) return;

        db.ProductPriceHistory.Add(new ProductPriceHistory
        {
            StoreProduct = sp, Type = type, OldPrice = current, NewPrice = newPrice,
            ChangedByUserId = userId, Note = note,
        });
        if (type == PriceType.Sale) sp.SalePrice = newPrice;
        else sp.PurchasePrice = newPrice;
        sp.UpdatedAt = DateTime.UtcNow;
    }

    // quantity: girişte pozitif, çıkışta negatif
    public static StockMovement MoveStock(AppDbContext db, StoreProduct sp, StockMovementType type, decimal quantity,
        Guid userId, decimal? unitPrice = null, Guid? referenceId = null, string? note = null)
    {
        sp.StockQuantity += quantity;
        sp.UpdatedAt = DateTime.UtcNow;
        var movement = new StockMovement
        {
            StoreProduct = sp, Type = type, Quantity = quantity, BalanceAfter = sp.StockQuantity,
            UnitPrice = unitPrice, ReferenceId = referenceId, UserId = userId, Note = note,
        };
        db.StockMovements.Add(movement);
        return movement;
    }

    public static ProductLookupDto ToLookup(Product p, StoreProduct? sp) => new(
        p.Id, p.Barcode, p.Name, p.Brand, p.Quantity, p.ImageUrl, p.Category?.Name,
        sp?.SalePrice, sp?.PurchasePrice, sp?.VatRate ?? 20, sp?.StockQuantity ?? 0, sp?.MinStockLevel);
}
