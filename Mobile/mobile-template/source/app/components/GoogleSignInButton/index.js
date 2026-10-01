import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { useDispatch } from 'react-redux';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { BaseColor } from '@/config';
import { AuthActions } from '@/actions';
import { authApi } from '@/api';
import Button from '@/components/Button';
import Text from '@/components/Text';
import Icon from '@/components/Icon';

// Client ID'ler backend'den okunur; Google yapılandırılmamışsa buton gösterilmez.
let configured = null;
const ensureConfigured = async () => {
  if (configured) return configured;
  const cfg = await authApi.googleConfig();
  if (!cfg?.webClientId) return null;
  // iOS'ta Info.plist'e ters çevrilmiş iOS client ID URL scheme'i eklenmeden signIn çöker
  if (Platform.OS === 'ios' && !cfg.iosClientId) return null;
  GoogleSignin.configure({
    webClientId: cfg.webClientId,
    iosClientId: cfg.iosClientId || undefined,
  });
  configured = cfg;
  return cfg;
};

const GoogleSignInButton = ({ onResult, style }) => {
  const dispatch = useDispatch();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    ensureConfigured()
      .then((cfg) => setEnabled(!!cfg))
      .catch(() => setEnabled(false));
  }, []);

  const onPress = async () => {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response)) {
        setLoading(false);
        return; // kullanıcı iptal etti
      }
      const idToken = response.data?.idToken;
      if (!idToken) throw new Error('Google oturumu alınamadı.');

      dispatch(
        AuthActions.googleAuthentication(idToken, (result) => {
          setLoading(false);
          onResult?.(result);
        })
      );
    } catch (error) {
      setLoading(false);
      if (isErrorWithCode(error) && error.code === statusCodes.IN_PROGRESS) return;
      console.warn('[AUTH] google sign-in error:', error?.code, error?.message);
      onResult?.({ success: false, error: 'Google ile giriş yapılamadı.' });
    }
  };

  if (!enabled) return null;

  return (
    <View style={style}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 16 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: BaseColor.dividerColor }} />
        <Text caption1 grayColor style={{ marginHorizontal: 8 }}>veya</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: BaseColor.dividerColor }} />
      </View>
      <Button
        full
        outline
        loading={loading}
        onPress={onPress}
        icon={<Icon name="google" brand size={16} color="#DB4437" style={{ marginRight: 8 }} />}
      >
        Google ile devam et
      </Button>
    </View>
  );
};

export default GoogleSignInButton;
