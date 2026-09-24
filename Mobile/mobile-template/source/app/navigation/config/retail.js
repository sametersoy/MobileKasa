import UrunDetay from '@/screens/UrunDetay';
import AlisGecmisi from '@/screens/AlisGecmisi';
import Tedarikciler from '@/screens/Tedarikciler';
import Subeler from '@/screens/Subeler';
import Profile from '@/screens/Profile';

// Perakende ekranlarının sekme dışı (stack) sayfaları
export default {
  UrunDetay: { component: UrunDetay, options: { title: 'Ürün Detayı' } },
  AlisGecmisi: { component: AlisGecmisi, options: { title: 'Stok Girişleri' } },
  Tedarikciler: { component: Tedarikciler, options: { title: 'Tedarikçiler' } },
  Subeler: { component: Subeler, options: { title: 'Şubeler' } },
  Hesabim: { component: Profile, options: { title: 'Hesabım' } },
};
