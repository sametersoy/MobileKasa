namespace MobileServis.DTOs;

public record PagedResult<T>(IList<T> Data, int Total, int Page, int PageSize);

public record DashboardDto(
    IList<BuildingSummaryDto> Buildings,
    int UnreadNotifications,
    int UnpaidDues,
    int ActivePolls,
    int OpenTenders,
    IList<MobileTransactionDto> RecentTransactions
);

public record BuildingSummaryDto(
    Guid Id,
    string Name,
    string Address,
    string Type,
    int UnitCount,
    int UnpaidDuesCount,
    int UnreadNotificationCount,
    int ActivePollsCount
);
