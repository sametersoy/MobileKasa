namespace WebServis.Models;

public class Poll
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BuildingId { get; set; }
    public string Question { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public Guid CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Building Building { get; set; } = null!;
    public ICollection<PollOption> Options { get; set; } = [];
    public ICollection<PollVote> Votes { get; set; } = [];
}

public class PollOption
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PollId { get; set; }
    public string Text { get; set; } = string.Empty;
    public int OrderIndex { get; set; }

    public Poll Poll { get; set; } = null!;
    public ICollection<PollVote> Votes { get; set; } = [];
}

public class PollVote
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PollId { get; set; }
    public Guid PollOptionId { get; set; }
    public Guid UserId { get; set; }
    public DateTime VotedAt { get; set; } = DateTime.UtcNow;

    public Poll Poll { get; set; } = null!;
    public PollOption Option { get; set; } = null!;
}
