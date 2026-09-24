namespace WebServis.Models;

public class Meter
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UnitId { get; set; }
    public MeterType Type { get; set; }
    public string SerialNumber { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Unit Unit { get; set; } = null!;
    public ICollection<MeterReading> Readings { get; set; } = [];
}

public class MeterReading
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MeterId { get; set; }
    public DateOnly ReadingDate { get; set; }
    public decimal Value { get; set; }
    public decimal PreviousValue { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Amount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Meter Meter { get; set; } = null!;
}

public enum MeterType { Electric, Gas, Water }
