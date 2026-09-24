import { LogBox } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Utils from '@/utils';
import App from './navigation';
import { StoreProvider } from './context/StoreContext';
import { persistor, store } from './store';

LogBox.ignoreAllLogs();

Utils.setupLayoutAnimation();

const MobilKasa = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <StoreProvider>
            <App />
          </StoreProvider>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
};

export default MobilKasa;
