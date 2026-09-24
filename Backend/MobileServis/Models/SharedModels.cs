namespace MobileServis.Models;

public class BuildingMember
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BuildingId { get; set; }
    public Guid UserId { get; set; }
    public MemberRole Role { get; set; } = MemberRole.Manager;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    public Building Building { get; set; } = null!;
}
public enum MemberRole { Owner, Manager, Viewer }

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
public enum DuesCalculationType { FixedPerUnit, PerSquareMeter }

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

public class Poll
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BuildingId { get; set; }
    public string Question { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public Guid CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Building Building { get; set; } = null!;
    public ICollection<PollOption> Options { get; set; } = [];
    public ICollection<PollVote> Votes { get; set; } = [];
}
public class PollOption
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PollId { get; set; }
    public string Text { get; set; } = string.Empty;
    public int OrderIndex { get; set; }

    public Poll Poll { get; set; } = null!;
    public ICollection<PollVote> Votes { get; set; } = [];
}
public class PollVote
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PollId { get; set; }
    public Guid PollOptionId { get; set; }
    public Guid UserId { get; set; }
    public DateTime VotedAt { get; set; } = DateTime.UtcNow;

    public Poll Poll { get; set; } = null!;
    public PollOption Option { get; set; } = null!;
}

public class Notification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BuildingId { get; set; }
    public Guid? TargetUserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public NotificationType Type { get; set; } = NotificationType.General;
    public bool IsRead { get; set; }
    public Guid CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Building Building { get; set; } = null!;
}
public enum NotificationType { General, Dues, Tender, Poll, Maintenance }

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

public class DeviceToken
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DevicePlatform Platform { get; set; }
    public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;
    public DateTime LastSeenAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
}
public enum DevicePlatform { Android, iOS }

public class Feedback
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public Guid? BuildingId { get; set; }
    public FeedbackType Type { get; set; } = FeedbackType.General;
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public int? Rating { get; set; }
    public FeedbackStatus Status { get; set; } = FeedbackStatus.New;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
public enum FeedbackType { General, Bug, Suggestion, Complaint }
public enum FeedbackStatus { New, InReview, Resolved }
