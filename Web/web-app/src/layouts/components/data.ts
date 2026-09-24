import { type MenuItemType } from '@/types'

export const menuItems: MenuItemType[] = [
  {
    icon: 'dashboard',
    slug: 'main',
    label: 'Ana Menü',
    isTitle: true,
    children: [
      { url: '/panel', icon: 'dashboard', slug: 'panel', label: 'Panel' },
      { url: '/satis', icon: 'cash-register', slug: 'satis', label: 'Satış' },
      { url: '/satislar', icon: 'receipt', slug: 'satislar', label: 'Satışlar' },
    ],
  },
  {
    icon: 'packages',
    slug: 'urun-stok',
    label: 'Ürün & Stok',
    isTitle: true,
    children: [
      { url: '/urunler', icon: 'packages', slug: 'urunler', label: 'Ürünler' },
      { url: '/stok-girisi', icon: 'truck-delivery', slug: 'stok-girisi', label: 'Stok Girişi' },
      { url: '/stok-girisleri', icon: 'history', slug: 'stok-girisleri', label: 'Stok Girişleri' },
      { url: '/tedarikciler', icon: 'truck', slug: 'tedarikciler', label: 'Tedarikçiler' },
    ],
  },
  {
    icon: 'building-store',
    slug: 'magaza',
    label: 'Mağaza',
    isTitle: true,
    children: [{ url: '/subeler', icon: 'building-store', slug: 'subeler', label: 'Şubeler' }],
  },
  {
    icon: 'user',
    slug: 'hesap',
    label: 'Hesabım',
    isTitle: true,
    children: [
      {
        url: '/pages/profile',
        icon: 'user',
        slug: 'profil',
        label: 'Profil',
      },
    ],
  },
]
