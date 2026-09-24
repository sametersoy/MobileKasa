namespace WebServis.Models;

public class Sale
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StoreId { get; set; }
    public Guid CashierUserId { get; set; }
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Cash;
    public decimal TotalAmount { get; set; }
    public decimal VatAmount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Store Store { get; set; } = null!;
    public ICollection<SaleItem> Items { get; set; } = [];
}

// Satış anındaki ürün adı/barkod/fiyat kopyalanır; katalog sonradan değişse de fiş aynı kalır
public class SaleItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SaleId { get; set; }
    public Guid StoreProductId { get; set; }
    public string Barcode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal VatRate { get; set; }
    public decimal LineTotal { get; set; }

    public Sale Sale { get; set; } = null!;
    public StoreProduct StoreProduct { get; set; } = null!;
}

public enum PaymentMethod { Cash, Card }
