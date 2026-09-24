using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using WebServis.Models;

namespace WebServis.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Building> Buildings => Set<Building>();
    public DbSet<BuildingMember> BuildingMembers => Set<BuildingMember>();
    public DbSet<Unit> Units => Set<Unit>();
    public DbSet<FinancialTransaction> FinancialTransactions => Set<FinancialTransaction>();
    public DbSet<Meter> Meters => Set<Meter>();
    public DbSet<MeterReading> MeterReadings => Set<MeterReading>();
    public DbSet<DuesRule> DuesRules => Set<DuesRule>();
    public DbSet<Dues> Dues => Set<Dues>();
    public DbSet<Tender> Tenders => Set<Tender>();
    public DbSet<TenderOffer> TenderOffers => Set<TenderOffer>();
    public DbSet<Poll> Polls => Set<Poll>();
    public DbSet<PollOption> PollOptions => Set<PollOption>();
    public DbSet<PollVote> PollVotes => Set<PollVote>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<ResidentUser> ResidentUsers => Set<ResidentUser>();
    public DbSet<Feedback> Feedbacks => Set<Feedback>();

    public DbSet<ResidentUnitLink> ResidentUnitLinks => Set<ResidentUnitLink>();

    public DbSet<Store> Stores => Set<Store>();
    public DbSet<StoreMember> StoreMembers => Set<StoreMember>();
    public DbSet<ProductCategory> ProductCategories => Set<ProductCategory>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<StoreProduct> StoreProducts => Set<StoreProduct>();
    public DbSet<ProductPriceHistory> ProductPriceHistory => Set<ProductPriceHistory>();
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();
    public DbSet<Sale> Sales => Set<Sale>();
    public DbSet<SaleItem> SaleItems => Set<SaleItem>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<Purchase> Purchases => Set<Purchase>();
    public DbSet<PurchaseItem> PurchaseItems => Set<PurchaseItem>();

    protected override void OnModelCreating(ModelBuilder m)
    {
        m.Entity<ResidentUser>()
            .ToTable("Users", t => t.ExcludeFromMigrations())
            .HasMany(u => u.ResidentUnits)
            .WithOne()
            .HasForeignKey(ru => ru.UserId);

        m.Entity<ResidentUnitLink>()
            .ToTable("ResidentUnits", t => t.ExcludeFromMigrations())
            .HasKey(x => new { x.UserId, x.UnitId });

        m.Entity<BuildingMember>()
            .HasIndex(x => new { x.BuildingId, x.UserId }).IsUnique();

        m.Entity<PollVote>()
            .HasIndex(x => new { x.PollId, x.UserId }).IsUnique();

        m.Entity<FinancialTransaction>()
            .Property(x => x.Amount).HasPrecision(18, 2);

        m.Entity<Meter>()
            .HasOne(x => x.Unit)
            .WithMany(x => x.Meters)
            .HasForeignKey(x => x.UnitId)
            .OnDelete(DeleteBehavior.Cascade);

        m.Entity<MeterReading>()
            .Property(x => x.Amount).HasPrecision(18, 2);

        m.Entity<DuesRule>()
            .Property(x => x.Amount).HasPrecision(18, 2);

        m.Entity<Dues>()
            .Property(x => x.Amount).HasPrecision(18, 2);

        m.Entity<TenderOffer>()
            .Property(x => x.Amount).HasPrecision(18, 2);

        m.Entity<Document>()
            .HasOne(x => x.Unit)
            .WithMany(x => x.Documents)
            .HasForeignKey(x => x.UnitId)
            .OnDelete(DeleteBehavior.SetNull);

        m.Entity<StoreMember>()
            .HasIndex(x => new { x.StoreId, x.UserId }).IsUnique();

        m.Entity<ProductCategory>()
            .HasIndex(x => x.Slug).IsUnique();

        m.Entity<Product>(e =>
        {
            e.Property(x => x.Barcode).HasMaxLength(32);
            e.Property(x => x.Name).HasMaxLength(300);
            e.Property(x => x.Brand).HasMaxLength(200);
            e.Property(x => x.Quantity).HasMaxLength(50);
            e.HasIndex(x => x.Barcode).IsUnique();
            e.HasIndex(x => x.Name);
            e.HasOne(x => x.Category).WithMany(x => x.Products)
                .HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.SetNull);
        });

        m.Entity<StoreProduct>(e =>
        {
            e.HasIndex(x => new { x.StoreId, x.ProductId }).IsUnique();
            e.Property(x => x.PurchasePrice).HasPrecision(18, 2);
            e.Property(x => x.SalePrice).HasPrecision(18, 2);
            e.Property(x => x.VatRate).HasPrecision(5, 2);
            e.Property(x => x.StockQuantity).HasPrecision(18, 3);
            e.Property(x => x.MinStockLevel).HasPrecision(18, 3);
            e.HasOne(x => x.Store).WithMany(x => x.Products)
                .HasForeignKey(x => x.StoreId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Product).WithMany()
                .HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
        });

        m.Entity<ProductPriceHistory>(e =>
        {
            e.Property(x => x.OldPrice).HasPrecision(18, 2);
            e.Property(x => x.NewPrice).HasPrecision(18, 2);
            e.HasIndex(x => new { x.StoreProductId, x.Type, x.ChangedAt });
        });

        m.Entity<StockMovement>(e =>
        {
            e.Property(x => x.Quantity).HasPrecision(18, 3);
            e.Property(x => x.BalanceAfter).HasPrecision(18, 3);
            e.Property(x => x.UnitPrice).HasPrecision(18, 2);
            e.HasIndex(x => new { x.StoreProductId, x.CreatedAt });
        });

        m.Entity<Sale>(e =>
        {
            e.Property(x => x.TotalAmount).HasPrecision(18, 2);
            e.Property(x => x.VatAmount).HasPrecision(18, 2);
            e.HasIndex(x => new { x.StoreId, x.CreatedAt });
        });

        m.Entity<SaleItem>(e =>
        {
            e.Property(x => x.Barcode).HasMaxLength(32);
            e.Property(x => x.ProductName).HasMaxLength(300);
            e.Property(x => x.Quantity).HasPrecision(18, 3);
            e.Property(x => x.UnitPrice).HasPrecision(18, 2);
            e.Property(x => x.VatRate).HasPrecision(5, 2);
            e.Property(x => x.LineTotal).HasPrecision(18, 2);
            e.HasOne(x => x.StoreProduct).WithMany()
                .HasForeignKey(x => x.StoreProductId).OnDelete(DeleteBehavior.Restrict);
        });

        m.Entity<Supplier>(e =>
        {
            e.Property(x => x.Name).HasMaxLength(200);
            e.HasIndex(x => new { x.StoreId, x.Name });
        });

        m.Entity<Purchase>(e =>
        {
            e.Property(x => x.TotalAmount).HasPrecision(18, 2);
            e.Property(x => x.DocumentNo).HasMaxLength(100);
            e.HasIndex(x => new { x.StoreId, x.CreatedAt });
            e.HasOne(x => x.Supplier).WithMany()
                .HasForeignKey(x => x.SupplierId).OnDelete(DeleteBehavior.SetNull);
        });

        m.Entity<PurchaseItem>(e =>
        {
            e.Property(x => x.Barcode).HasMaxLength(32);
            e.Property(x => x.ProductName).HasMaxLength(300);
            e.Property(x => x.Quantity).HasPrecision(18, 3);
            e.Property(x => x.UnitCost).HasPrecision(18, 2);
            e.Property(x => x.LineTotal).HasPrecision(18, 2);
            e.HasOne(x => x.StoreProduct).WithMany()
                .HasForeignKey(x => x.StoreProductId).OnDelete(DeleteBehavior.Restrict);
        });

        // Legacy timestamp modunda okunan tarihler Kind=Unspecified gelir ve JSON'a "Z" olmadan yazılır.
        // Perakende tablolarında tüm tarihler UTC saklandığı için okurken UTC olarak işaretle.
        var utc = new ValueConverter<DateTime, DateTime>(v => v, v => DateTime.SpecifyKind(v, DateTimeKind.Utc));
        var utcNullable = new ValueConverter<DateTime?, DateTime?>(
            v => v, v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : v);
        Type[] retailEntities =
        [
            typeof(Store), typeof(StoreMember), typeof(Product), typeof(StoreProduct), typeof(ProductPriceHistory),
            typeof(StockMovement), typeof(Sale), typeof(Supplier), typeof(Purchase),
        ];
        foreach (var property in retailEntities.SelectMany(t => m.Entity(t).Metadata.GetProperties()))
        {
            if (property.ClrType == typeof(DateTime)) property.SetValueConverter(utc);
            else if (property.ClrType == typeof(DateTime?)) property.SetValueConverter(utcNullable);
        }
    }
}
