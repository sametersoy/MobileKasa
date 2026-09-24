using WebServis.Models;

namespace WebServis.DTOs;

public record CreateBuildingDto(string Name, string Address, BuildingType Type);
public record UpdateBuildingDto(string Name, string Address, BuildingType Type);
public record BuildingDto(Guid Id, string Name, string Address, BuildingType Type, DateTime CreatedAt, int UnitCount);
public record ResidentListDto(Guid Id, string FullName, string Email, string? Phone, Guid? BuildingId, List<Guid> UnitIds, DateTime CreatedAt);
