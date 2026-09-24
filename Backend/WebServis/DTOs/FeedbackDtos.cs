using WebServis.Models;

namespace WebServis.DTOs;

public record CreateFeedbackDto(
    FeedbackType Type,
    string Subject,
    string Message,
    int? Rating);

public record FeedbackDto(
    Guid Id,
    Guid UserId,
    string UserName,
    string UserEmail,
    Guid? BuildingId,
    FeedbackType Type,
    string Subject,
    string Message,
    int? Rating,
    FeedbackStatus Status,
    bool IsRead,
    DateTime CreatedAt);

public record UpdateFeedbackStatusDto(FeedbackStatus Status);
