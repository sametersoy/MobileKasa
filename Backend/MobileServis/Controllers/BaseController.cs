using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MobileServis.Data;

namespace MobileServis.Controllers;

[ApiController]
[Authorize]
public abstract class BaseController(AppDbContext db) : ControllerBase
{
    protected AppDbContext Db { get; } = db;

    protected Guid UserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")!);

    protected async Task<bool> HasBuildingAccessAsync(Guid buildingId) =>
        await Db.Buildings.AnyAsync(b => b.Id == buildingId && b.CreatedByUserId == UserId)
        || await Db.BuildingMembers.AnyAsync(m => m.BuildingId == buildingId && m.UserId == UserId);
}
