using Auth.Models;
using Microsoft.EntityFrameworkCore;

namespace Auth.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<ResidentUnit> ResidentUnits => Set<ResidentUnit>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();

        modelBuilder.Entity<ResidentUnit>()
            .HasKey(ru => new { ru.UserId, ru.UnitId });

        modelBuilder.Entity<ResidentUnit>()
            .HasOne(ru => ru.User)
            .WithMany(u => u.ResidentUnits)
            .HasForeignKey(ru => ru.UserId);
    }
}
