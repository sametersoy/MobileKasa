namespace WebServis.Models;

public class Document
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BuildingId { get; set; }
    public Guid? UnitId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string StoragePath { get; set; } = string.Empty;
    public DocumentCategory Category { get; set; } = DocumentCategory.General;
    public Guid UploadedByUserId { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    public Building Building { get; set; } = null!;
    public Unit? Unit { get; set; }
}

public enum DocumentCategory { General, Contract, Invoice, Meeting, Legal }
