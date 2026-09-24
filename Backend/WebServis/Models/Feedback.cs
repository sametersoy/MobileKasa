namespace WebServis.Models;

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
