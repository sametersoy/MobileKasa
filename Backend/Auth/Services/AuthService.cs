using Auth.Data;
using Auth.DTOs;
using Auth.Models;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Auth.Services;

public class AuthService(AppDbContext db, IJwtService jwtService) : IAuthService
{
    public async Task<AuthResponseDto?> LoginAsync(LoginDto dto)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email && u.IsActive);
        if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return null;

        return new AuthResponseDto(jwtService.GenerateToken(user), user.Email, user.FullName, user.Role, user.BuildingId);
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        var user = new User
        {
            Email = dto.Email,
            FullName = dto.FullName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = "yonetici"
        };

        db.Users.Add(user);
        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException pg && pg.SqlState == "23505")
        {
            throw new InvalidOperationException("Bu e-posta adresi zaten kayıtlı.");
        }

        return new AuthResponseDto(jwtService.GenerateToken(user), user.Email, user.FullName, user.Role, null);
    }

    public async Task<AuthResponseDto> RegisterSakinAsync(RegisterSakinDto dto)
    {
        var user = new User
        {
            Email = dto.Email,
            FullName = dto.FullName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = "sakin",
            BuildingId = dto.BuildingId,
            Phone = dto.Phone
        };

        db.Users.Add(user);
        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException pg && pg.SqlState == "23505")
        {
            throw new InvalidOperationException("Bu e-posta adresi zaten kayıtlı.");
        }

        db.ResidentUnits.Add(new ResidentUnit { UserId = user.Id, UnitId = dto.UnitId });
        await db.SaveChangesAsync();

        return new AuthResponseDto(jwtService.GenerateToken(user), user.Email, user.FullName, user.Role, user.BuildingId);
    }

    public async Task<bool> DeleteAccountAsync(Guid userId)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null) return false;

        var units = await db.ResidentUnits.Where(ru => ru.UserId == userId).ToListAsync();
        db.ResidentUnits.RemoveRange(units);
        db.Users.Remove(user);
        await db.SaveChangesAsync();
        return true;
    }
}
