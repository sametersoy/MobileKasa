using WebServis.Models;

namespace WebServis.DTOs;

public record CreateMeterDto(Guid UnitId, MeterType Type, string SerialNumber);
public record MeterDto(Guid Id, Guid UnitId, string UnitNumber, MeterType Type, string SerialNumber);
public record CreateReadingDto(DateOnly ReadingDate, decimal Value, decimal UnitPrice);
public record ReadingDto(Guid Id, Guid MeterId, DateOnly ReadingDate, decimal Value, decimal PreviousValue, decimal UnitPrice, decimal Amount, DateTime CreatedAt);
