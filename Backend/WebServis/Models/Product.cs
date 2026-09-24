namespace WebServis.Models;

// Tüm mağazaların ortak kullandığı barkodlu ürün kataloğu (fiyat/stok içermez)
public class Product
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Barcode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Brand { get; set; }
    public Guid? CategoryId { get; set; }
    public string? Quantity { get; set; }            // Paket içeriği, örn. "500 g", "1 L"
    public ProductUnit Unit { get; set; } = ProductUnit.Piece;
    public string? ImageUrl { get; set; }
    public ProductSource Source { get; set; } = ProductSource.Manual;
    public Guid? CreatedByStoreId { get; set; }      // Mağazanın kendi eklediği ürünler için
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ProductCategory? Category { get; set; }
}

public class ProductCategory
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public int SortOrder { get; set; }

    public ICollection<Product> Products { get; set; } = [];
}

public enum ProductUnit { Piece, Kilogram, Liter, Meter }

public enum ProductSource { Manual, OpenFoodFacts, OpenBeautyFacts, OpenProductsFacts }
