using WebServis.Models;

namespace WebServis.DTOs;

public record CreateTransactionDto(TransactionType Type, decimal Amount, string Category, string Description, DateOnly Date, Guid? UnitId, Guid? ResidentUserId);
public record TransactionDto(Guid Id, Guid BuildingId, Guid? UnitId, string? UnitNumber, Guid? ResidentUserId, string? ResidentName, TransactionType Type, decimal Amount, string Category, string Description, DateOnly Date, DateTime CreatedAt);
public record ResidentUserDto(Guid Id, string FullName, string Email, List<Guid> UnitIds);
public record FinancialSummaryDto(decimal TotalIncome, decimal TotalExpense, decimal Balance, IList<CategorySummary> ByCategory);
public record CategorySummary(string Category, TransactionType Type, decimal Total);
