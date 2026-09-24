namespace WebServis.Models;

public class FinancialTransaction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BuildingId { get; set; }
    public Guid? UnitId { get; set; }
    public Guid? ResidentUserId { get; set; }
    public TransactionType Type { get; set; }
    public decimal Amount { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateOnly Date { get; set; }
    public Guid CreatedByUserId { get; set; }
    public Guid? DuesId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Building Building { get; set; } = null!;
    public Unit? Unit { get; set; }
}

public enum TransactionType { Income, Expense }
