using WebServis.Models;

namespace WebServis.DTOs;

public record CreateNotificationDto(string Title, string Body, NotificationType Type, Guid? TargetUserId);
public record NotificationDto(Guid Id, Guid BuildingId, string Title, string Body, NotificationType Type, bool IsRead, DateTime CreatedAt);
