using WebServis.Models;

namespace WebServis.DTOs;

public record DocumentDto(Guid Id, Guid BuildingId, Guid? UnitId, string Name, string FileName, string ContentType, long FileSizeBytes, DocumentCategory Category, DateTime UploadedAt);
