namespace WebServis.Models;

public class Building
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public BuildingType Type { get; set; }
    public Guid CreatedByUserId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<BuildingMember> Members { get; set; } = [];
    public ICollection<Unit> Units { get; set; } = [];
    public ICollection<FinancialTransaction> Transactions { get; set; } = [];
    public ICollection<DuesRule> DuesRules { get; set; } = [];
    public ICollection<Tender> Tenders { get; set; } = [];
    public ICollection<Poll> Polls { get; set; } = [];
    public ICollection<Notification> Notifications { get; set; } = [];
    public ICollection<Document> Documents { get; set; } = [];
}

public enum BuildingType { Apartment, Site }
