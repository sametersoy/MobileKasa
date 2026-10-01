namespace WebServis.Models;

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
}
