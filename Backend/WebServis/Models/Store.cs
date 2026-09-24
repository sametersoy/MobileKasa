namespace WebServis.Models;

public class Store
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public Guid OwnerUserId { get; set; }
    public string? TaxNumber { get; set; }
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<StoreMember> Members { get; set; } = [];
    public ICollection<StoreProduct> Products { get; set; } = [];
}

public class StoreMember
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StoreId { get; set; }
    public Guid UserId { get; set; }
    public StoreRole Role { get; set; } = StoreRole.Cashier;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    public Store Store { get; set; } = null!;
}

public enum StoreRole { Owner, Manager, Cashier }
