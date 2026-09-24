using WebServis.Models;

namespace WebServis.DTOs;

public record CreateDuesRuleDto(string Name, DuesCalculationType CalculationType, decimal Amount, int DayOfMonth);
public record DuesRuleDto(Guid Id, Guid BuildingId, string Name, DuesCalculationType CalculationType, decimal Amount, int DayOfMonth, bool IsActive);

public record GenerateDuesDto(string Period, DateOnly DueDate);
public record DuesDto(Guid Id, Guid UnitId, string UnitNumber, string Period, decimal Amount, DateOnly DueDate, DateOnly? PaidDate, bool IsPaid, string? Note);
public record PayDuesDto(DateOnly PaidDate, string? Note);
