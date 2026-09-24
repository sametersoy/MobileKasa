using System.IO.Compression;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using WebServis.Models;

namespace WebServis.Data;

// Ürün kataloğu boşsa Data/Seed/products-tr.json.gz dosyasından doldurur.
// Kaynak: Open Food Facts / Open Beauty Facts / Open Products Facts (ODbL) — bkz. Data/Seed/README.md
public static class ProductSeeder
{
    private record SeedCategory(string Slug, string Name, int SortOrder);
    private record SeedProduct(string Barcode, string Name, string? Brand, string? Category,
        string? Quantity, ProductUnit Unit, string? ImageUrl, ProductSource Source);
    private record SeedFile(List<SeedCategory> Categories, List<SeedProduct> Products);

    public static void Seed(AppDbContext db, ILogger logger)
    {
        if (db.Products.Any()) return;

        var path = Path.Combine(AppContext.BaseDirectory, "Data", "Seed", "products-tr.json.gz");
        if (!File.Exists(path))
        {
            logger.LogWarning("Ürün seed dosyası bulunamadı: {Path}", path);
            return;
        }

        using var stream = new GZipStream(File.OpenRead(path), CompressionMode.Decompress);
        var seed = JsonSerializer.Deserialize<SeedFile>(stream, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
        })!;

        var categories = seed.Categories.ToDictionary(
            c => c.Slug,
            c => new ProductCategory { Name = c.Name, Slug = c.Slug, SortOrder = c.SortOrder });
        db.ProductCategories.AddRange(categories.Values);
        db.SaveChanges();

        db.ChangeTracker.AutoDetectChangesEnabled = false;
        foreach (var batch in seed.Products.Chunk(2000))
        {
            db.Products.AddRange(batch.Select(p => new Product
            {
                Barcode = p.Barcode,
                Name = p.Name,
                Brand = p.Brand,
                CategoryId = p.Category != null && categories.TryGetValue(p.Category, out var c) ? c.Id : null,
                Quantity = p.Quantity,
                Unit = p.Unit,
                ImageUrl = p.ImageUrl,
                Source = p.Source,
            }));
            db.SaveChanges();
            db.ChangeTracker.Clear();
        }
        db.ChangeTracker.AutoDetectChangesEnabled = true;

        logger.LogInformation("Ürün kataloğu yüklendi: {Categories} kategori, {Products} ürün",
            categories.Count, seed.Products.Count);
    }
}
