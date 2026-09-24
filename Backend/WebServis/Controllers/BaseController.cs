using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebServis.Data;
using WebServis.Models;

namespace WebServis.Controllers;

[ApiController]
[Authorize]
public abstract class BaseController(AppDbContext db) : ControllerBase
{
    protected AppDbContext Db { get; } = db;

    protected Guid UserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")!);

    protected string UserRole =>
        User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;

    protected Guid? ClaimUnitId =>
        Guid.TryParse(User.FindFirstValue("unitId"), out var id) ? id : null;

    protected Guid? ClaimBuildingId =>
        Guid.TryParse(User.FindFirstValue("buildingId"), out var id) ? id : null;

    protected async Task<bool> HasBuildingAccessAsync(Guid buildingId) =>
        await Db.Buildings.AnyAsync(b => b.Id == buildingId && b.CreatedByUserId == UserId)
        || await Db.BuildingMembers.AnyAsync(m => m.BuildingId == buildingId && m.UserId == UserId);

    protected async Task<bool> HasStoreAccessAsync(Guid storeId) =>
        await GetStoreRoleAsync(storeId) is not null;

    protected async Task<StoreRole?> GetStoreRoleAsync(Guid storeId) =>
        await Db.StoreMembers
            .Where(m => m.StoreId == storeId && m.UserId == UserId && m.Store.IsActive)
            .Select(m => (StoreRole?)m.Role)
            .FirstOrDefaultAsync();

    // Fiyat, stok girişi, tedarikçi gibi yönetim işlemleri: sahip ve yönetici
    protected async Task<bool> CanManageStoreAsync(Guid storeId) =>
        await GetStoreRoleAsync(storeId) is StoreRole.Owner or StoreRole.Manager;
}
