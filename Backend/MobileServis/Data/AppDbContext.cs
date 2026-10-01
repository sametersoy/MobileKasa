using Microsoft.EntityFrameworkCore;
using MobileServis.Models;

namespace MobileServis.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<DeviceToken> DeviceTokens => Set<DeviceToken>();
    public DbSet<Feedback> Feedbacks => Set<Feedback>();

    protected override void OnModelCreating(ModelBuilder m)
    {
        // Feedbacks tablosu WebServis'e ait, burada migration'a dahil edilmez
        m.Entity<Feedback>().ToTable("Feedbacks").ToTable(tb => tb.ExcludeFromMigrations());

        // Mobile-specific table — only this is managed by MobileServis migrations
        m.Entity<DeviceToken>().ToTable("DeviceTokens")
            .HasIndex(x => new { x.UserId, x.Token }).IsUnique();
    }
}
