import { useEffect, useRef, useState } from 'react';
import { Modal, View, TouchableOpacity, TextInput, StyleSheet, Linking } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useCodeScanner } from 'react-native-vision-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Icon } from '@/components';

const CODE_TYPES = ['ean-13', 'ean-8', 'upc-a', 'upc-e', 'code-128', 'code-39', 'itf'];

// Tam ekran barkod okuyucu; ilk okunan kodu onScanned ile bildirir
export default function BarcodeScanner({ visible, onClose, onScanned }) {
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const [torch, setTorch] = useState(false);
  const [manual, setManual] = useState('');
  const locked = useRef(false);

  useEffect(() => {
    if (visible) {
      locked.current = false;
      setManual('');
      if (!hasPermission) requestPermission();
    } else {
      setTorch(false);
    }
  }, [visible, hasPermission, requestPermission]);

  const emit = (code) => {
    if (locked.current || !code) return;
    locked.current = true;
    onScanned(code.trim());
  };

  const codeScanner = useCodeScanner({
    codeTypes: CODE_TYPES,
    onCodeScanned: (codes) => emit(codes[0]?.value),
  });

  const cameraReady = visible && hasPermission && device;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        {cameraReady ? (
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={visible}
            codeScanner={codeScanner}
            torch={torch ? 'on' : 'off'}
            enableZoomGesture
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.center]}>
            <Icon name="camera" size={40} color="#9CA3AF" />
            <Text body1 whiteColor style={styles.info}>
              {!hasPermission
                ? 'Barkod okutmak için kamera izni gerekiyor.'
                : 'Kamera bulunamadı. Barkodu aşağıya elle girebilirsiniz.'}
            </Text>
            {!hasPermission && (
              <TouchableOpacity
                onPress={() => requestPermission().then((ok) => !ok && Linking.openSettings())}
                style={styles.permissionButton}
              >
                <Text body2 bold whiteColor>
                  İzin Ver
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <SafeAreaView style={styles.overlay} edges={['top', 'bottom']} pointerEvents="box-none">
          <View style={styles.topBar}>
            <TouchableOpacity onPress={onClose} style={styles.roundButton}>
              <Icon name="times" size={20} color="#fff" />
            </TouchableOpacity>
            <Text title3 bold whiteColor>
              Barkod Okut
            </Text>
            <TouchableOpacity onPress={() => setTorch((t) => !t)} style={styles.roundButton} disabled={!cameraReady}>
              <Icon name="bolt" size={18} color={torch ? '#FBBF24' : '#fff'} />
            </TouchableOpacity>
          </View>

          <View style={styles.frameArea} pointerEvents="none">
            {cameraReady && (
              <>
                <View style={styles.frame} />
                <Text body2 whiteColor style={styles.hint}>
                  Barkodu çerçevenin içine hizalayın
                </Text>
              </>
            )}
          </View>

          <View style={styles.manualRow}>
            <TextInput
              value={manual}
              onChangeText={setManual}
              placeholder="Barkodu elle gir"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              returnKeyType="search"
              onSubmitEditing={() => emit(manual)}
              style={styles.manualInput}
            />
            <TouchableOpacity onPress={() => emit(manual)} style={styles.manualButton} disabled={!manual.trim()}>
              <Icon name="search" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  info: { textAlign: 'center', marginTop: 12 },
  permissionButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#374151',
  },
  overlay: { flex: 1, justifyContent: 'space-between' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  roundButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  frameArea: { alignItems: 'center' },
  frame: { width: '78%', aspectRatio: 1.6, borderWidth: 3, borderColor: '#fff', borderRadius: 16 },
  hint: {
    marginTop: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  manualRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, gap: 8 },
  manualInput: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.95)',
    color: '#111827',
    fontSize: 16,
  },
  manualButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
  },
});
