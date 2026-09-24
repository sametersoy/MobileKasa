using WebServis.Models;

namespace WebServis.DTOs;

public record ResidentBuildingDto(Guid Id, string Name, string Address, string Type);

public record ResidentUnitDto(
    Guid Id,
    string Number,
    int Floor,
    UnitType Type,
    decimal AreaM2,
    bool IsOccupied,
    ResidentBuildingDto Building
);

public record ResidentDuesDto(
    Guid Id,
    string Period,
    decimal Amount,
    DateOnly DueDate,
    bool IsPaid,
    DateOnly? PaidDate,
    string? Note
);

public record ResidentMeterDto(
    Guid Id,
    string Name,
    MeterType Type,
    string Unit,
    decimal? LastReading,
    DateTime? LastReadingDate
);

public record ResidentNotificationDto(
    Guid Id,
    string Title,
    string Body,
    NotificationType Type,
    bool IsRead,
    DateTime CreatedAt
);

public record ResidentDashboardDto(
    ResidentUnitDto Unit,
    IEnumerable<ResidentDuesDto> UnpaidDues,
    IEnumerable<ResidentMeterDto> Meters,
    IEnumerable<ResidentNotificationDto> RecentNotifications
);
