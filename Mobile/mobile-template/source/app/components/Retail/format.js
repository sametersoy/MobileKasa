export const fmt = (n) =>
  '₺' + Number(n ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// "12,50" / "12.50" / "1.250,00" → 12.5 ; geçersizse null
export const parseAmount = (text) => {
  const cleaned = String(text ?? '')
    .trim()
    .replace(/\s/g, '');
  if (!cleaned) return null;
  const normalized = cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned;
  const value = Number(normalized);
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
};

export const fmtQty = (n) => Number(n ?? 0).toLocaleString('tr-TR', { maximumFractionDigits: 3 });

export const fmtDateTime = (iso) =>
  new Date(iso).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const fmtTime = (iso) => new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

export const fmtDay = (iso) =>
  new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });

// Fiyat alanlarına yazmak için: 12.5 → "12,50"
export const toInput = (n) => (n == null ? '' : Number(n).toFixed(2).replace('.', ','));

export const PAYMENT_LABELS = { 0: 'Nakit', 1: 'Kart' };

export const MOVEMENT_LABELS = {
  0: 'Açılış',
  1: 'Stok girişi',
  2: 'Satış',
  3: 'İade',
  4: 'Sayım düzeltmesi',
  5: 'Fire / zayi',
};
