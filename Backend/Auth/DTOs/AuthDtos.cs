namespace Auth.DTOs;

public record LoginDto(string Email, string Password);
public record RegisterDto(string Email, string Password, string FullName);
public record RegisterSakinDto(string Email, string Password, string FullName, Guid BuildingId, Guid UnitId, string? Phone = null);
public record AuthResponseDto(string Token, string Email, string FullName, string Role, Guid? BuildingId);
public record ResidentDto(Guid Id, string FullName, string Email, string? Phone, Guid? BuildingId, List<Guid> UnitIds, DateTime CreatedAt);
public record UpdateResidentUnitDto(Guid UnitId);
public record UpdateResidentDto(string FullName, string? Phone);
