using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
}
