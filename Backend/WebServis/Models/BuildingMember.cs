namespace WebServis.Models;

public class BuildingMember
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BuildingId { get; set; }
    public Guid UserId { get; set; }
    public MemberRole Role { get; set; } = MemberRole.Manager;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    public Building Building { get; set; } = null!;
}

public enum MemberRole { Owner, Manager, Viewer }
