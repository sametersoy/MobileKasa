namespace WebServis.Models;

public class DuesRule
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BuildingId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DuesCalculationType CalculationType { get; set; }
    public decimal Amount { get; set; }
    public int DayOfMonth { get; set; } = 1;
    public bool IsActive { get; set; } = true;

    public Building Building { get; set; } = null!;
}

public class Dues
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BuildingId { get; set; }
    public Guid UnitId { get; set; }
    public string Period { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateOnly DueDate { get; set; }
    public DateOnly? PaidDate { get; set; }
    public bool IsPaid { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Unit Unit { get; set; } = null!;
}

public enum DuesCalculationType { FixedPerUnit, PerSquareMeter }
