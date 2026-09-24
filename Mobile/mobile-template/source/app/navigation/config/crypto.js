import FCrypto060708 from '@/screens/FCrypto060708';
import FCryptol02 from '@/screens/FCryptol02';
import { Dashboard3 } from '@/screens/FHome';
import Satis from '@/screens/Satis';
import Urunler from '@/screens/Urunler';
import StokGiris from '@/screens/StokGiris';
import SatisGecmisi from '@/screens/SatisGecmisi';
import MagazaMenu from '@/screens/MagazaMenu';
import { BottomTabNavigatorMazi, tabBarIcon } from '@/navigation/components';

// Perakende ana menüsü (girişten sonra açılan alt sekmeler)
export const CryptoTabScreens = {
  Satis: {
    component: Satis,
    options: {
      title: 'Satış',
      tabBarIcon: ({ color }) => tabBarIcon({ color, name: 'cash-register' }),
    },
  },
  Urunler: {
    component: Urunler,
    options: {
      title: 'Ürünler',
      tabBarIcon: ({ color }) => tabBarIcon({ color, name: 'boxes' }),
    },
  },
  StokGiris: {
    component: StokGiris,
    options: {
      title: 'Stok',
      tabBarIcon: ({ color }) => tabBarIcon({ color, name: 'dolly' }),
    },
  },
  SatisGecmisi: {
    component: SatisGecmisi,
    options: {
      title: 'Satışlar',
      tabBarIcon: ({ color }) => tabBarIcon({ color, name: 'receipt' }),
    },
  },
  MagazaMenu: {
    component: MagazaMenu,
    options: {
      title: 'Mağaza',
      tabBarIcon: ({ color }) => tabBarIcon({ color, name: 'store' }),
    },
  },
};

const CryptoMenu = () => <BottomTabNavigatorMazi tabScreens={CryptoTabScreens} />;

export default {
  CryptoMenu: {
    component: CryptoMenu,
    options: {
      title: 'home',
    },
  },
  Dashboard3: {
    component: Dashboard3,
    options: {
      title: 'report',
    },
  },
  FCryptol02: {
    component: FCryptol02,
    options: {
      title: 'detailed_information',
    },
  },
  FCrypto060708: {
    component: FCrypto060708,
    options: {
      title: 'activities',
    },
  },
};
