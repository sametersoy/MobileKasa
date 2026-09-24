using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebServis.Data;
using WebServis.DTOs;
using WebServis.Helpers;
using WebServis.Models;

namespace WebServis.Controllers;

// Mağazalar / şubeler ve çalışanları
[Route("api/stores")]
public class StoresController(AppDbContext db) : BaseController(db)
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var stores = await Db.StoreMembers
            .Where(m => m.UserId == UserId && m.Store.IsActive)
            .OrderBy(m => m.JoinedAt)
            .Select(m => new StoreDto(m.Store.Id, m.Store.Name, m.Role, m.Store.Address, m.Store.Phone, m.Store.TaxNumber))
            .ToListAsync();
        return Ok(stores);
    }

    // Kullanıcının ilk mağazası; hiç yoksa kullanıcı sahibi olarak yeni bir mağaza açılır
    [HttpGet("current")]
    public async Task<IActionResult> Current()
    {
        var member = await Db.StoreMembers
            .Include(m => m.Store)
            .Where(m => m.UserId == UserId && m.Store.IsActive)
            .OrderBy(m => m.JoinedAt)
            .FirstOrDefaultAsync();

        if (member is null)
        {
            var store = new Store { Name = "Mağazam", OwnerUserId = UserId };
            member = new StoreMember { Store = store, UserId = UserId, Role = StoreRole.Owner };
            Db.StoreMembers.Add(member);
            await Db.SaveChangesAsync();
        }

        return Ok(ToDto(member.Store, member.Role));
    }

    [HttpPost]
    public async Task<IActionResult> Create(SaveStoreDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) return BadRequest(new { message = "Şube adı zorunlu." });
        var store = new Store { OwnerUserId = UserId };
        Apply(store, dto);
        Db.StoreMembers.Add(new StoreMember { Store = store, UserId = UserId, Role = StoreRole.Owner });
        await Db.SaveChangesAsync();
        return Ok(ToDto(store, StoreRole.Owner));
    }

    [HttpPut("{storeId:guid}")]
    public async Task<IActionResult> Update(Guid storeId, SaveStoreDto dto)
    {
        var role = await GetStoreRoleAsync(storeId);
        if (role is not (StoreRole.Owner or StoreRole.Manager)) return Forbid();
        if (string.IsNullOrWhiteSpace(dto.Name)) return BadRequest(new { message = "Şube adı zorunlu." });
        var store = await Db.Stores.FirstAsync(s => s.Id == storeId);
        Apply(store, dto);
        await Db.SaveChangesAsync();
        return Ok(ToDto(store, role.Value));
    }

    // Şubeyi kapatır (veriler silinmez)
    [HttpDelete("{storeId:guid}")]
    public async Task<IActionResult> Deactivate(Guid storeId)
    {
        if (await GetStoreRoleAsync(storeId) != StoreRole.Owner) return Forbid();
        var activeCount = await Db.StoreMembers.CountAsync(m => m.UserId == UserId && m.Role == StoreRole.Owner && m.Store.IsActive);
        if (activeCount <= 1) return BadRequest(new { message = "Son şube kapatılamaz." });
        var store = await Db.Stores.FirstAsync(s => s.Id == storeId);
        store.IsActive = false;
        await Db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{storeId:guid}/members")]
    public async Task<IActionResult> Members(Guid storeId)
    {
        if (!await HasStoreAccessAsync(storeId)) return Forbid();
        var members = await Db.StoreMembers
            .Where(m => m.StoreId == storeId)
            .Join(Db.ResidentUsers, m => m.UserId, u => u.Id, (m, u) => new { m, u })
            .OrderBy(x => x.m.Role).ThenBy(x => x.u.FullName)
            .ToListAsync();
        return Ok(members.Select(x => new StoreMemberDto(
            x.u.Id, x.u.FullName, MaskHelper.MaskEmail(x.u.Email), x.m.Role, x.m.JoinedAt)));
    }

    // Kayıtlı bir kullanıcıyı e-posta ile şubeye kasiyer/yönetici olarak ekler
    [HttpPost("{storeId:guid}/members")]
    public async Task<IActionResult> AddMember(Guid storeId, AddStoreMemberDto dto)
    {
        if (await GetStoreRoleAsync(storeId) != StoreRole.Owner) return Forbid();
        if (dto.Role == StoreRole.Owner) return BadRequest(new { message = "Şubenin tek sahibi olabilir." });

        var email = dto.Email.Trim().ToLowerInvariant();
        var user = await Db.ResidentUsers.FirstOrDefaultAsync(u => u.Email.ToLower() == email && u.IsActive);
        if (user is null) return NotFound(new { message = "Bu e-posta ile kayıtlı kullanıcı bulunamadı." });

        var member = await Db.StoreMembers.FirstOrDefaultAsync(m => m.StoreId == storeId && m.UserId == user.Id);
        if (member is null)
        {
            member = new StoreMember { StoreId = storeId, UserId = user.Id, Role = dto.Role };
            Db.StoreMembers.Add(member);
        }
        else if (member.Role == StoreRole.Owner)
        {
            return BadRequest(new { message = "Şube sahibinin rolü değiştirilemez." });
        }
        else
        {
            member.Role = dto.Role;
        }
        await Db.SaveChangesAsync();
        return Ok(new StoreMemberDto(user.Id, user.FullName, MaskHelper.MaskEmail(user.Email), member.Role, member.JoinedAt));
    }

    [HttpDelete("{storeId:guid}/members/{userId}")]
    public async Task<IActionResult> RemoveMember(Guid storeId, Guid userId)
    {
        if (await GetStoreRoleAsync(storeId) != StoreRole.Owner) return Forbid();
        var member = await Db.StoreMembers.FirstOrDefaultAsync(m => m.StoreId == storeId && m.UserId == userId);
        if (member is null) return NotFound();
        if (member.Role == StoreRole.Owner) return BadRequest(new { message = "Şube sahibi çıkarılamaz." });
        Db.StoreMembers.Remove(member);
        await Db.SaveChangesAsync();
        return NoContent();
    }

    private static void Apply(Store store, SaveStoreDto dto)
    {
        store.Name = dto.Name.Trim();
        store.Address = Clean(dto.Address);
        store.Phone = Clean(dto.Phone);
        store.TaxNumber = Clean(dto.TaxNumber);
    }

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static StoreDto ToDto(Store s, StoreRole role) => new(s.Id, s.Name, role, s.Address, s.Phone, s.TaxNumber);
}
