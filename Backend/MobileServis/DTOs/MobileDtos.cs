using MobileServis.Models;

namespace MobileServis.DTOs;

// Buildings
public record MobileBuildingDto(Guid Id, string Name, string Address, BuildingType Type, int UnitCount, DateTime CreatedAt);

// Units
public record MobileUnitDto(Guid Id, string Number, int Floor, UnitType Type, decimal AreaM2, bool IsOccupied);
public record CreateUnitDto(string Number, int Floor, UnitType Type, decimal AreaM2, bool IsOccupied = false);
public record UpdateUnitDto(string Number, int Floor, UnitType Type, decimal AreaM2, bool IsOccupied);

// Financial
public record MobileTransactionDto(Guid Id, TransactionType Type, decimal Amount, string Category, string Description, DateOnly Date);

// Meters
public record MobileMeterDto(Guid Id, string UnitNumber, MeterType Type, string SerialNumber, decimal? LastReading, DateOnly? LastReadingDate);
public record MobileReadingDto(Guid Id, DateOnly ReadingDate, decimal Value, decimal PreviousValue, decimal Amount);
public record CreateReadingDto(DateOnly ReadingDate, decimal Value, decimal UnitPrice);

// Dues
public record MobileDuesDto(Guid Id, Guid UnitId, string UnitNumber, string Period, decimal Amount, DateOnly DueDate, bool IsPaid, DateOnly? PaidDate);
public record PayDuesDto(DateOnly PaidDate, string? Note);

// Tenders
public record MobileTenderDto(Guid Id, string Title, string Description, DateOnly Deadline, TenderStatus Status, int OfferCount, DateTime CreatedAt);
public record CreateOfferDto(string CompanyName, string ContactEmail, string ContactPhone, decimal Amount, string Description);

// Polls
public record MobilePollDto(Guid Id, string Question, DateTime EndDate, bool IsActive, bool UserVoted, IList<MobilePollOptionDto> Options);
public record MobilePollOptionDto(Guid Id, string Text, int VoteCount);
public record VoteDto(Guid PollOptionId);

// Notifications
public record MobileNotificationDto(Guid Id, string Title, string Body, NotificationType Type, bool IsRead, DateTime CreatedAt);

// Documents
public record MobileDocumentDto(Guid Id, string Name, string FileName, string ContentType, long FileSizeBytes, DocumentCategory Category, DateTime UploadedAt);

// Device
public record RegisterDeviceDto(string Token, DevicePlatform Platform);

// Financial create
public record CreateTransactionDto(TransactionType Type, decimal Amount, string Category, string Description, DateOnly Date);

// Residents
public record MobileResidentDto(Guid Id, string FullName, string Email, string? Phone, List<Guid> UnitIds);
