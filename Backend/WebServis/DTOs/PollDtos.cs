namespace WebServis.DTOs;

public record CreatePollDto(string Question, string Description, DateTime StartDate, DateTime EndDate, IList<string> Options);
public record PollDto(Guid Id, Guid BuildingId, string Question, string Description, DateTime StartDate, DateTime EndDate, bool IsActive, IList<PollOptionDto> Options, int TotalVotes, DateTime CreatedAt);
public record PollOptionDto(Guid Id, string Text, int VoteCount);
public record VoteDto(Guid PollOptionId);
