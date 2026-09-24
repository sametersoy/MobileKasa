namespace WebServis.Models;

// Bir ürünün belirli bir mağazadaki güncel fiyatı ve stoğu
public class StoreProduct
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StoreId { get; set; }
    public Guid ProductId { get; set; }
    public decimal? PurchasePrice { get; set; }
    public decimal? SalePrice { get; set; }
    public decimal VatRate { get; set; } = 20;       // KDV oranı (%)
    public decimal StockQuantity { get; set; }
    public decimal? MinStockLevel { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Store Store { get; set; } = null!;
    public Product Product { get; set; } = null!;
    public ICollection<ProductPriceHistory> PriceHistory { get; set; } = [];
    public ICollection<StockMovement> StockMovements { get; set; } = [];
}

// Alış ve satış fiyatlarındaki her değişiklik
public class ProductPriceHistory
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StoreProductId { get; set; }
    public PriceType Type { get; set; }
    public decimal? OldPrice { get; set; }
    public decimal NewPrice { get; set; }
    public Guid? ChangedByUserId { get; set; }
    public string? Note { get; set; }
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

    public StoreProduct StoreProduct { get; set; } = null!;
}

// Stoğu değiştiren her hareket; Quantity girişte pozitif, çıkışta negatif
public class StockMovement
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StoreProductId { get; set; }
    public StockMovementType Type { get; set; }
    public decimal Quantity { get; set; }
    public decimal BalanceAfter { get; set; }
    public decimal? UnitPrice { get; set; }
    public Guid? ReferenceId { get; set; }           // İlgili satış/alış belgesi
    public Guid? UserId { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public StoreProduct StoreProduct { get; set; } = null!;
}

public enum PriceType { Purchase, Sale }

public enum StockMovementType { Initial, Purchase, Sale, Return, Adjustment, Waste }
