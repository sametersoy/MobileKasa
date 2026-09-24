import { useEffect, useRef, useState } from 'react';
import i18n from 'i18next';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { NavigationContainer, StackActions } from '@react-navigation/native';
import { initReactI18next } from 'react-i18next';
import { Platform, StatusBar, View, useColorScheme } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { ApplicationActions } from '@/actions';
import { logout as authLogout } from '@/actions/auth';
import { setUnauthorizedHandler } from '@/api';
import * as Utils from '@/utils';
import { languageSelect } from '@/selectors';
import { BaseSetting, useTheme } from '@/config';
import { AllScreens, ModalScreens } from './config/index';
import * as rootNavigation from './rootNavigation';

const RootStack = createStackNavigator();
const MainStack = createStackNavigator();

const MainScreens = () => {
  return (
    <MainStack.Navigator
      // initialRouteName="SliderIntro"
      screenOptions={{
        headerShown: false,
      }}
    >
      {Object.keys(AllScreens).map((name) => {
        const { component, options } = AllScreens[name];
        return <MainStack.Screen key={name} name={name} component={component} options={options} />;
      })}
    </MainStack.Navigator>
  );
};

const Navigator = () => {
  const { theme } = useTheme();
  const isDarkMode = useColorScheme() === 'dark';
  const language = useSelector(languageSelect);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const isLoggedIn = useSelector((state) => state.auth?.isLoggedIn ?? false);

  useEffect(() => {
    // Config status bar
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(isDarkMode ? 'black' : 'white', true);
    }
    StatusBar.setBarStyle(isDarkMode ? 'light-content' : 'dark-content', true);
  }, [isDarkMode]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      dispatch(authLogout());
    });
  }, [dispatch]);

  const wasLoggedIn = useRef(isLoggedIn);
  useEffect(() => {
    if (wasLoggedIn.current && !isLoggedIn) {
      rootNavigation.dispatch(StackActions.replace('SignIn'));
    }
    wasLoggedIn.current = isLoggedIn;
  }, [isLoggedIn]);

  useEffect(() => {
    // Splash screen auto-dismisses with New Architecture

    const onProcess = async () => {
      // Get current language of device
      const languageCode = language ?? BaseSetting.defaultLanguage;
      dispatch(ApplicationActions.onChangeLanguage(languageCode));
      // Config language for app
      await i18n.use(initReactI18next).init({
        compatibilityJSON: 'v3',
        resources: BaseSetting.resourcesLanguage,
        lng: languageCode,
        fallbackLng: languageCode,
      });
      Utils.enableExperimental();
      setLoading(false);
      rootNavigation.dispatch(
        StackActions.replace(isLoggedIn ? 'CryptoMenu' : 'SignIn')
      );
      // navigationRef?.current?.dispatch(
      //     StackActions.replace(intro ? "ProjectMenu" : "MaziHome")
      // );
    };
    onProcess();
  }, []);

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <NavigationContainer theme={theme} ref={rootNavigation.navigationRef}>
        <RootStack.Navigator
          screenOptions={{
            presentation: 'transparentModal',
            headerShown: false,
            cardStyle: { backgroundColor: 'transparent' },
            cardOverlayEnabled: true,
            cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter,
          }}
        >
          <RootStack.Screen name="MainScreens" component={MainScreens} options={{ headerShown: false }} />
          {Object.keys(ModalScreens).map((name) => {
            const { component, options } = ModalScreens[name];
            return <RootStack.Screen key={name} name={name} component={component} options={options} />;
          })}
        </RootStack.Navigator>
      </NavigationContainer>

    </View>
  );
};

export default Navigator;
