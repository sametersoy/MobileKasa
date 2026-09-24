using WebServis.Models;

namespace WebServis.DTOs;

public record CreateUnitDto(string Number, int Floor, UnitType Type, decimal AreaM2);
public record UpdateUnitDto(string Number, int Floor, UnitType Type, decimal AreaM2, bool IsOccupied);
public record UnitDto(Guid Id, Guid BuildingId, string Number, int Floor, UnitType Type, decimal AreaM2, bool IsOccupied);
