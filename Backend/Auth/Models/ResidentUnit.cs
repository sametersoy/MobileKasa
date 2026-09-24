namespace Auth.Models;

public class ResidentUnit
{
    public Guid UserId { get; set; }
    public Guid UnitId { get; set; }
    public User User { get; set; } = null!;
}
