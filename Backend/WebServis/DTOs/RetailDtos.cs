using WebServis.Models;

namespace WebServis.DTOs;

public record PagedResult<T>(List<T> Items, int Total, int Page, int PageSize);

// ── Mağaza / şube ──────────────────────────────────────────────
public record StoreDto(Guid Id, string Name, StoreRole Role, string? Address, string? Phone, string? TaxNumber);

public record SaveStoreDto(string Name, string? Address, string? Phone, string? TaxNumber);

public record StoreMemberDto(Guid UserId, string FullName, string Email, StoreRole Role, DateTime JoinedAt);

public record AddStoreMemberDto(string Email, StoreRole Role);

// ── Ürünler ───────────────────────────────────────────────────
public record ProductLookupDto(
    Guid ProductId, string Barcode, string Name, string? Brand, string? Quantity, string? ImageUrl,
    string? Category, decimal? SalePrice, decimal? PurchasePrice, decimal VatRate, decimal StockQuantity,
    decimal? MinStockLevel);

public record CreateStoreProductDto(string Barcode, string Name, string? Brand, decimal? SalePrice);

public record UpdateStoreProductDto(decimal? SalePrice, decimal? PurchasePrice, decimal? VatRate, decimal? MinStockLevel);

// Adjustment: sayılan miktar (CountedQuantity) girilir; Waste/Return: Quantity kadar düşülür/eklenir
public record StockAdjustmentDto(StockMovementType Type, decimal? CountedQuantity, decimal? Quantity, string? Note);

public record PriceHistoryDto(PriceType Type, decimal? OldPrice, decimal NewPrice, string? Note, DateTime ChangedAt);

public record StockMovementDto(
    StockMovementType Type, decimal Quantity, decimal BalanceAfter, decimal? UnitPrice, string? Note, DateTime CreatedAt);

public record ProductSalesStatsDto(int Days, decimal Quantity, decimal Revenue);

// Tüm şubeler görünümü: ürünün şubelerdeki toplam stoğu ve satış fiyatı aralığı
public record AllStoresProductDto(
    Guid ProductId, string Barcode, string Name, string? Brand, string? Quantity, string? ImageUrl, string? Category,
    decimal? MinSalePrice, decimal? MaxSalePrice, decimal StockQuantity, int StoreCount, bool LowStock);

public record ProductBranchDto(
    Guid StoreId, string StoreName, decimal? SalePrice, decimal? PurchasePrice, decimal StockQuantity, decimal? MinStockLevel);

public record ProductDetailDto(
    ProductLookupDto Product, List<PriceHistoryDto> PriceHistory, List<StockMovementDto> StockMovements,
    ProductSalesStatsDto Sales);

// ── Satış ─────────────────────────────────────────────────────
public record SaleItemInput(Guid ProductId, decimal Quantity, decimal UnitPrice);

public record CreateSaleDto(List<SaleItemInput> Items, PaymentMethod PaymentMethod);

public record SaleItemDto(Guid ProductId, string Barcode, string ProductName, decimal Quantity, decimal UnitPrice, decimal LineTotal);

public record SaleDto(
    Guid Id, PaymentMethod PaymentMethod, decimal TotalAmount, decimal VatAmount, DateTime CreatedAt,
    int ItemCount, List<SaleItemDto> Items, Guid StoreId, string? StoreName);

public record StoreSalesSummaryDto(Guid StoreId, string StoreName, int SaleCount, decimal TotalAmount);

// ByStore yalnızca tüm şubeler özetinde dolu
public record SalesSummaryDto(
    int SaleCount, decimal TotalAmount, decimal VatAmount, decimal CashAmount, decimal CardAmount,
    List<StoreSalesSummaryDto>? ByStore = null);

// ── Tedarikçi ─────────────────────────────────────────────────
public record SupplierDto(
    Guid Id, string Name, string? ContactName, string? Phone, string? Email, string? TaxNumber, string? Address,
    string? Note, int PurchaseCount, decimal PurchaseTotal);

public record SaveSupplierDto(
    string Name, string? ContactName, string? Phone, string? Email, string? TaxNumber, string? Address, string? Note);

// ── Stok girişi (mal kabul) ───────────────────────────────────
public record PurchaseItemInput(Guid ProductId, decimal Quantity, decimal UnitCost, decimal? SalePrice);

public record CreatePurchaseDto(Guid? SupplierId, string? DocumentNo, string? Note, List<PurchaseItemInput> Items);

public record PurchaseItemDto(Guid ProductId, string Barcode, string ProductName, decimal Quantity, decimal UnitCost, decimal LineTotal);

public record PurchaseDto(
    Guid Id, Guid? SupplierId, string? SupplierName, string? DocumentNo, string? Note, decimal TotalAmount,
    DateTime CreatedAt, int ItemCount, List<PurchaseItemDto> Items);
