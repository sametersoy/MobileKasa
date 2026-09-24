using Microsoft.EntityFrameworkCore;
using MobileServis.Models;

namespace MobileServis.Data;

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
    public DbSet<DeviceToken> DeviceTokens => Set<DeviceToken>();
    public DbSet<Feedback> Feedbacks => Set<Feedback>();
    public DbSet<ResidentUser> ResidentUsers => Set<ResidentUser>();
    public DbSet<ResidentUnitLink> ResidentUnitLinks => Set<ResidentUnitLink>();

    protected override void OnModelCreating(ModelBuilder m)
    {
        // Shared tables — WebServis owns the schema, excluded from migrations here
        m.Entity<Building>().ToTable("Buildings").ToTable(tb => tb.ExcludeFromMigrations());
        m.Entity<BuildingMember>().ToTable("BuildingMembers").ToTable(tb => tb.ExcludeFromMigrations())
            .HasIndex(x => new { x.BuildingId, x.UserId }).IsUnique();
        m.Entity<Unit>().ToTable("Units").ToTable(tb => tb.ExcludeFromMigrations());
        m.Entity<FinancialTransaction>().ToTable("FinancialTransactions").ToTable(tb => tb.ExcludeFromMigrations())
            .Property(x => x.Amount).HasPrecision(18, 2);
        m.Entity<Meter>().ToTable("Meters").ToTable(tb => tb.ExcludeFromMigrations());
        m.Entity<MeterReading>().ToTable("MeterReadings").ToTable(tb => tb.ExcludeFromMigrations())
            .Property(x => x.Amount).HasPrecision(18, 2);
        m.Entity<DuesRule>().ToTable("DuesRules").ToTable(tb => tb.ExcludeFromMigrations())
            .Property(x => x.Amount).HasPrecision(18, 2);
        m.Entity<Dues>().ToTable("Dues").ToTable(tb => tb.ExcludeFromMigrations())
            .Property(x => x.Amount).HasPrecision(18, 2);
        m.Entity<Tender>().ToTable("Tenders").ToTable(tb => tb.ExcludeFromMigrations());
        m.Entity<TenderOffer>().ToTable("TenderOffers").ToTable(tb => tb.ExcludeFromMigrations())
            .Property(x => x.Amount).HasPrecision(18, 2);
        m.Entity<Poll>().ToTable("Polls").ToTable(tb => tb.ExcludeFromMigrations());
        m.Entity<PollOption>().ToTable("PollOptions").ToTable(tb => tb.ExcludeFromMigrations());
        m.Entity<PollVote>().ToTable("PollVotes").ToTable(tb => tb.ExcludeFromMigrations())
            .HasIndex(x => new { x.PollId, x.UserId }).IsUnique();
        m.Entity<Notification>().ToTable("Notifications").ToTable(tb => tb.ExcludeFromMigrations());
        m.Entity<Document>().ToTable("Documents").ToTable(tb => tb.ExcludeFromMigrations());

        m.Entity<Feedback>().ToTable("Feedbacks").ToTable(tb => tb.ExcludeFromMigrations());

        m.Entity<ResidentUser>()
            .ToTable("Users", t => t.ExcludeFromMigrations())
            .HasMany(u => u.ResidentUnits)
            .WithOne()
            .HasForeignKey(ru => ru.UserId);
        m.Entity<ResidentUnitLink>()
            .ToTable("ResidentUnits", t => t.ExcludeFromMigrations())
            .HasKey(x => new { x.UserId, x.UnitId });

        // Mobile-specific table — only this is managed by MobileServis migrations
        m.Entity<DeviceToken>().ToTable("DeviceTokens")
            .HasIndex(x => new { x.UserId, x.Token }).IsUnique();
    }
}
