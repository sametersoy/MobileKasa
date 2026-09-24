export const fmt = (n?: number | null) =>
  '₺' + Number(n ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const fmtQty = (n?: number | null) => Number(n ?? 0).toLocaleString('tr-TR', { maximumFractionDigits: 3 })

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })

export const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })

// "12,50" / "12.50" / "1.250,00" → 12.5 ; geçersizse null
export const parseAmount = (text: string | number | null | undefined): number | null => {
  const cleaned = String(text ?? '').trim().replace(/\s/g, '')
  if (!cleaned) return null
  const normalized = cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned
  const value = Number(normalized)
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : null
}

export const toInput = (n?: number | null) => (n == null ? '' : Number(n).toFixed(2).replace('.', ','))

export const PAYMENT_LABELS: Record<number, string> = { 0: 'Nakit', 1: 'Kart' }

export const MOVEMENT_LABELS: Record<number, string> = {
  0: 'Açılış',
  1: 'Stok girişi',
  2: 'Satış',
  3: 'İade',
  4: 'Sayım düzeltmesi',
  5: 'Fire / zayi',
}

export const startOfDay = (offsetDays = 0) => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + offsetDays)
  return d
}

// Stok sıfır/altındaysa kırmızı, minimum seviyede veya altındaysa (tüm şubelerde: herhangi bir şubede) turuncu
export const stockVariant = (p: { stockQuantity: number; minStockLevel?: number | null; lowStock?: boolean }) => {
  if (p.stockQuantity <= 0) return 'danger'
  if (p.lowStock || (p.minStockLevel != null && p.stockQuantity <= p.minStockLevel)) return 'warning'
  return 'success'
}
