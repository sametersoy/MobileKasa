import api from '@/lib/api'

// Perakende API'si (WebServis /api/stores) — mobildeki storeApi ile aynı uçlar

export type StoreRole = 0 | 1 | 2 // Sahip, Yönetici, Kasiyer
export const ROLE_LABELS: Record<StoreRole, string> = { 0: 'Sahip', 1: 'Yönetici', 2: 'Kasiyer' }

export type Store = { id: string; name: string; role: StoreRole; address?: string; phone?: string; taxNumber?: string }
export type StoreMember = { userId: string; fullName: string; email: string; role: StoreRole; joinedAt: string }

export type Paged<T> = { items: T[]; total: number; page: number; pageSize: number }

export type Product = {
  productId: string
  barcode: string
  name: string
  brand?: string
  quantity?: string
  imageUrl?: string
  category?: string
  salePrice?: number | null
  purchasePrice?: number | null
  vatRate: number
  stockQuantity: number
  minStockLevel?: number | null
}

// Tüm şubeler görünümündeki birleşik ürün satırı
export type AllStoresProduct = Omit<Product, 'salePrice' | 'purchasePrice' | 'vatRate' | 'minStockLevel'> & {
  minSalePrice?: number | null
  maxSalePrice?: number | null
  storeCount: number
  lowStock: boolean
}

export type ProductBranch = {
  storeId: string
  storeName: string
  salePrice?: number | null
  purchasePrice?: number | null
  stockQuantity: number
  minStockLevel?: number | null
}

export type PriceHistory = { type: 0 | 1; oldPrice?: number | null; newPrice: number; note?: string; changedAt: string }
export type StockMovement = {
  type: number
  quantity: number
  balanceAfter: number
  unitPrice?: number | null
  note?: string
  createdAt: string
}
export type ProductDetail = {
  product: Product
  priceHistory: PriceHistory[]
  stockMovements: StockMovement[]
  sales: { days: number; quantity: number; revenue: number }
}

export type SaleItem = { productId: string; barcode: string; productName: string; quantity: number; unitPrice: number; lineTotal: number }
export type Sale = {
  id: string
  paymentMethod: 0 | 1
  totalAmount: number
  vatAmount: number
  createdAt: string
  itemCount: number
  items: SaleItem[]
  storeId: string
  storeName?: string
}
export type SalesSummary = {
  saleCount: number
  totalAmount: number
  vatAmount: number
  cashAmount: number
  cardAmount: number
  byStore?: { storeId: string; storeName: string; saleCount: number; totalAmount: number }[] | null
}

export type Supplier = {
  id: string
  name: string
  contactName?: string
  phone?: string
  email?: string
  taxNumber?: string
  address?: string
  note?: string
  purchaseCount: number
  purchaseTotal: number
}
export type SupplierInput = Omit<Supplier, 'id' | 'purchaseCount' | 'purchaseTotal'>

export type PurchaseItem = { productId: string; barcode: string; productName: string; quantity: number; unitCost: number; lineTotal: number }
export type Purchase = {
  id: string
  supplierId?: string
  supplierName?: string
  documentNo?: string
  note?: string
  totalAmount: number
  createdAt: string
  itemCount: number
  items: PurchaseItem[]
}

type Params = Record<string, string | number | boolean | undefined | null>
const clean = (p?: Params) => (p ? Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined && v !== null && v !== '')) : undefined)
const get = async <T>(url: string, params?: Params) => (await api.get<T>(`/stores${url}`, { params: clean(params) })).data
const post = async <T>(url: string, body?: unknown) => (await api.post<T>(`/stores${url}`, body)).data
const put = async <T>(url: string, body?: unknown) => (await api.put<T>(`/stores${url}`, body)).data
const del = async (url: string) => {
  await api.delete(`/stores${url}`)
}

export const retailApi = {
  // Şubeler
  stores: () => get<Store[]>(''),
  current: () => get<Store>('/current'),
  createStore: (body: Partial<Store>) => post<Store>('', body),
  updateStore: (id: string, body: Partial<Store>) => put<Store>(`/${id}`, body),
  deactivateStore: (id: string) => del(`/${id}`),
  members: (id: string) => get<StoreMember[]>(`/${id}/members`),
  addMember: (id: string, body: { email: string; role: StoreRole }) => post<StoreMember>(`/${id}/members`, body),
  removeMember: (id: string, userId: string) => del(`/${id}/members/${userId}`),
  // Ürünler
  products: (storeId: string, params: Params) => get<Paged<Product>>(`/${storeId}/products`, params),
  byBarcode: (storeId: string, barcode: string) => get<Product>(`/${storeId}/products/by-barcode/${encodeURIComponent(barcode)}`),
  createProduct: (storeId: string, body: { barcode: string; name: string; brand?: string; salePrice?: number | null }) =>
    post<Product>(`/${storeId}/products`, body),
  productDetail: (storeId: string, productId: string) => get<ProductDetail>(`/${storeId}/products/${productId}`),
  updateProduct: (storeId: string, productId: string, body: Partial<Pick<Product, 'salePrice' | 'purchasePrice' | 'vatRate' | 'minStockLevel'>>) =>
    put<Product>(`/${storeId}/products/${productId}`, body),
  adjustStock: (storeId: string, productId: string, body: { type: number; countedQuantity?: number; quantity?: number; note?: string }) =>
    post<Product>(`/${storeId}/products/${productId}/stock-adjustments`, body),
  // Satış
  createSale: (storeId: string, body: { paymentMethod: 0 | 1; items: { productId: string; quantity: number; unitPrice: number }[] }) =>
    post<Sale>(`/${storeId}/sales`, body),
  sales: (storeId: string, params: Params) => get<Paged<Sale>>(`/${storeId}/sales`, params),
  salesSummary: (storeId: string, params: Params) => get<SalesSummary>(`/${storeId}/sales/summary`, params),
  // Tedarikçiler
  suppliers: (storeId: string, params?: Params) => get<Supplier[]>(`/${storeId}/suppliers`, params),
  createSupplier: (storeId: string, body: SupplierInput) => post<Supplier>(`/${storeId}/suppliers`, body),
  updateSupplier: (storeId: string, id: string, body: SupplierInput) => put<Supplier>(`/${storeId}/suppliers/${id}`, body),
  deleteSupplier: (storeId: string, id: string) => del(`/${storeId}/suppliers/${id}`),
  // Stok girişi
  createPurchase: (storeId: string, body: { supplierId?: string | null; documentNo?: string | null; items: { productId: string; quantity: number; unitCost: number; salePrice?: number | null }[] }) =>
    post<Purchase>(`/${storeId}/purchases`, body),
  purchases: (storeId: string, params: Params) => get<Paged<Purchase>>(`/${storeId}/purchases`, params),
  // Tüm şubeler
  allProducts: (params: Params) => get<Paged<AllStoresProduct>>('/all/products', params),
  productBranches: (productId: string) => get<ProductBranch[]>(`/all/products/${productId}`),
  allSales: (params: Params) => get<Paged<Sale>>('/all/sales', params),
  allSalesSummary: (params: Params) => get<SalesSummary>('/all/sales/summary', params),
}

// Axios hata mesajı: backend { message } döner
export const errorMessage = (e: unknown, fallback = 'İşlem başarısız.') => {
  const data = (e as { response?: { data?: unknown } })?.response?.data as { message?: string } | string | undefined
  if (typeof data === 'string' && data) return data
  return (data as { message?: string })?.message ?? fallback
}

export const isNotFound = (e: unknown) => (e as { response?: { status?: number } })?.response?.status === 404
