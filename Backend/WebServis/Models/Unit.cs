namespace WebServis.Models;

public class Unit
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BuildingId { get; set; }
    public string Number { get; set; } = string.Empty;
    public int Floor { get; set; }
    public UnitType Type { get; set; } = UnitType.Residential;
    public decimal AreaM2 { get; set; }
    public bool IsOccupied { get; set; } = true;

    public Building Building { get; set; } = null!;
    public ICollection<Meter> Meters { get; set; } = [];
    public ICollection<Dues> Dues { get; set; } = [];
    public ICollection<Document> Documents { get; set; } = [];
}

public enum UnitType { Residential, Commercial, Parking }
