namespace MobileServis.Models;

// Auth servisinin "Users" tablosunu read-only okumak için — migration'a dahil edilmez
public class ResidentUser
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Role { get; set; } = string.Empty;
    public Guid? BuildingId { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public ICollection<ResidentUnitLink> ResidentUnits { get; set; } = [];
}

// Auth servisinin "ResidentUnits" tablosunu read-only okumak için — migration'a dahil edilmez
public class ResidentUnitLink
{
    public Guid UserId { get; set; }
    public Guid UnitId { get; set; }
}
