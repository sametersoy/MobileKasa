import { useState } from 'react';
import { Platform, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { AppleButton, appleAuth } from '@invertase/react-native-apple-authentication';
import { AuthActions } from '@/actions';

// Sign in with Apple — yalnızca iOS (App Store 4.8: Google girişine eşdeğer gizlilik dostu seçenek)
const AppleSignInButton = ({ onResult, style }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const onPress = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });
      if (!response.identityToken) throw new Error('Apple oturumu alınamadı.');

      // Apple adı yalnızca ilk yetkilendirmede verir; token'da yer almaz
      const { givenName, familyName } = response.fullName ?? {};
      const fullName = [givenName, familyName].filter(Boolean).join(' ') || null;

      dispatch(
        AuthActions.appleAuthentication(response.identityToken, fullName, (result) => {
          setLoading(false);
          onResult?.(result);
        })
      );
    } catch (error) {
      setLoading(false);
      if (error?.code === appleAuth.Error.CANCELED) return; // kullanıcı iptal etti
      console.warn('[AUTH] apple sign-in error:', error?.code, error?.message);
      onResult?.({ success: false, error: 'Apple ile giriş yapılamadı.' });
    }
  };

  if (Platform.OS !== 'ios' || !appleAuth.isSupported) return null;

  return (
    <View style={[{ marginTop: 12 }, style]}>
      <AppleButton
        buttonStyle={AppleButton.Style.BLACK}
        buttonType={AppleButton.Type.CONTINUE}
        cornerRadius={8}
        style={{ width: '100%', height: 46 }}
        onPress={onPress}
      />
    </View>
  );
};

export default AppleSignInButton;
