import SakinHome from '@/screens/SakinHome';
import UnitDetail from '@/screens/UnitDetail';
import Binalar from '@/screens/Binalar';
import Bildirimler from '@/screens/Bildirimler';
import Finans from '@/screens/Finans';
import Aidatlar from '@/screens/Aidatlar';
import Sayaclar from '@/screens/Sayaclar';
import Ihaleler from '@/screens/Ihaleler';
import Belgeler from '@/screens/Belgeler';
import FPost from '@/screens/FPost';
import AboutUs from '@/screens/AboutUs';
import ChangeLanguage from '@/screens/ChangeLanguage';
import ChangePassword from '@/screens/ChangePassword';
import ContactUs from '@/screens/ContactUs';
import MaziHome from '@/screens/MaziHome';
import PreviewComponent from '@/screens/PreviewComponent';
import ProfileEdit from '@/screens/ProfileEdit';
import ResetPassword from '@/screens/ResetPassword';
import Review from '@/screens/Review';
import Setting from '@/screens/Setting';
import SignIn from '@/screens/SignIn';
import SignUp from '@/screens/SignUp';
import ThemeSetting from '@/screens/ThemeSetting';
import Loading from '@/screens/Loading';
import SliderIntro from '@/screens/SliderIntro';

export default {
  SakinHome: {
    component: SakinHome,
    options: {
      title: 'Ana Ekran',
      gestureEnabled: false,
    },
  },
  Loading: {
    component: Loading,
    options: {
      title: 'loading',
      gestureEnabled: false,
    },
  },
  SliderIntro: {
    component: SliderIntro,
    options: {
      title: 'Slider Intro',
      gestureEnabled: false,
      animationEnabled: false,
    },
  },
  MaziHome: {
    component: MaziHome,
    options: {
      title: 'mazi_home',
    },
  },
  AboutUs: {
    component: AboutUs,
    options: {
      title: 'about_us',
    },
  },
  ChangeLanguage: {
    component: ChangeLanguage,
    options: {
      title: 'change_language',
    },
  },
  ChangePassword: {
    component: ChangePassword,
    options: {
      title: 'change_password',
    },
  },
  ContactUs: {
    component: ContactUs,
    options: {
      title: 'contact_us',
    },
  },
  Setting: {
    component: Setting,
    options: {
      title: 'setting',
    },
  },
  SignIn: {
    component: SignIn,
    options: {
      title: 'sign_in',
    },
  },
  SignUp: {
    component: SignUp,
    options: {
      title: 'sign_out',
    },
  },
  PreviewComponent: {
    component: PreviewComponent,
    options: {
      title: 'preview_component',
    },
  },
  ProfileEdit: {
    component: ProfileEdit,
    options: {
      title: 'edit_profile',
    },
  },
  ResetPassword: {
    component: ResetPassword,
    options: {
      title: 'reset_password',
    },
  },
  Review: {
    component: Review,
    options: {
      title: 'reviews',
    },
  },
  ThemeSetting: {
    component: ThemeSetting,
    options: {
      title: 'theme',
    },
  },
  Binalar: {
    component: Binalar,
    options: { title: 'Binalar', headerShown: false },
  },
  UnitDetail: {
    component: UnitDetail,
    options: { title: 'Daire Detay' },
  },
  Bildirimler: {
    component: Bildirimler,
    options: { title: 'Bildirimler' },
  },
  Finans: {
    component: Finans,
    options: { title: 'Gelir / Gider' },
  },
  Aidatlar: {
    component: Aidatlar,
    options: { title: 'Aidatlar' },
  },
  Sayaclar: {
    component: Sayaclar,
    options: { title: 'Sayaçlar' },
  },
  Ihaleler: {
    component: Ihaleler,
    options: { title: 'İhaleler' },
  },
  Belgeler: {
    component: Belgeler,
    options: { title: 'Belgeler' },
  },
  FPost: {
    component: FPost,
    options: { title: 'Anketler' },
  },
};
