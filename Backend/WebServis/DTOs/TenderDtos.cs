using WebServis.Models;

namespace WebServis.DTOs;

public record CreateTenderDto(string Title, string Description, DateOnly Deadline);
public record TenderDto(Guid Id, Guid BuildingId, string Title, string Description, DateOnly Deadline, TenderStatus Status, int OfferCount, DateTime CreatedAt);
public record CreateOfferDto(string CompanyName, string ContactEmail, string ContactPhone, decimal Amount, string Description);
public record OfferDto(Guid Id, Guid TenderId, string CompanyName, string ContactEmail, string ContactPhone, decimal Amount, string Description, bool IsAwarded, DateTime SubmittedAt);
