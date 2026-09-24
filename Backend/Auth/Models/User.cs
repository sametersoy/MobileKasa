namespace Auth.Models;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    // Roller: "admin" | "yonetici" | "sakin"
    public string Role { get; set; } = "yonetici";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public string? Phone { get; set; }

    // Sakin kullanıcıları için — farklı serviste yaşayan referanslar (FK değil)
    public Guid? BuildingId { get; set; }

    public ICollection<ResidentUnit> ResidentUnits { get; set; } = [];
}
