namespace WebServis.Models;

public class Tender
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BuildingId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateOnly Deadline { get; set; }
    public TenderStatus Status { get; set; } = TenderStatus.Open;
    public Guid CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Building Building { get; set; } = null!;
    public ICollection<TenderOffer> Offers { get; set; } = [];
}

public class TenderOffer
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenderId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
    public string ContactPhone { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Description { get; set; } = string.Empty;
    public bool IsAwarded { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

    public Tender Tender { get; set; } = null!;
}

public enum TenderStatus { Open, Closed, Awarded }
