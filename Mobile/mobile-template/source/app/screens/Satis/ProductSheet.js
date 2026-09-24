import { useEffect, useState } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTheme, BaseColor } from '@/config';
import { Text, Icon, TextInput, Button } from '@/components';
import { fmt, parseAmount } from '@/components/Retail/format';

// Okutulan ürünün kartı. product null ise barkod katalogda yok → yeni ürün formu gösterilir.
export default function ProductSheet({ visible, barcode, product, saving, onAdd, onCreate, onRescan, onClose }) {
  const { colors } = useTheme();
  const isNew = !product;
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState('');

  useEffect(() => {
    if (!visible) return;
    setPrice(product?.salePrice != null ? String(product.salePrice).replace('.', ',') : '');
    setQuantity(1);
    setName('');
  }, [visible, product]);

  const unitPrice = parseAmount(price);
  const canSubmit = unitPrice != null && unitPrice > 0 && (!isNew || name.trim().length > 1);

  const submit = () => {
    if (!canSubmit) return;
    if (isNew) onCreate({ barcode, name: name.trim(), salePrice: unitPrice, quantity });
    else onAdd({ product, unitPrice, quantity });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={styles.handle} />

          {isNew ? (
            <View style={styles.header}>
              <View style={[styles.image, styles.placeholder, { backgroundColor: colors.card }]}>
                <Icon name="question" size={28} color={BaseColor.grayColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text title3 bold>
                  Katalogda yok
                </Text>
                <Text caption1 grayColor style={{ marginTop: 4 }}>
                  {barcode}
                </Text>
                <Text caption1 grayColor style={{ marginTop: 4 }}>
                  Ürünü mağazanıza ekleyip satışa devam edebilirsiniz.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.header}>
              {product.imageUrl ? (
                <Image
                  source={{ uri: product.imageUrl }}
                  style={[styles.image, { backgroundColor: '#fff' }]}
                  resizeMode="contain"
                />
              ) : (
                <View style={[styles.image, styles.placeholder, { backgroundColor: colors.card }]}>
                  <Icon name="box" size={28} color={BaseColor.grayColor} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text title3 bold numberOfLines={3}>
                  {product.name}
                </Text>
                {product.brand ? (
                  <Text body2 grayColor style={{ marginTop: 2 }}>
                    {product.brand}
                  </Text>
                ) : null}
                <Text caption1 grayColor style={{ marginTop: 4 }}>
                  {product.barcode}
                  {product.quantity ? ` · ${product.quantity}` : ''}
                </Text>
                <Text caption1 style={{ marginTop: 4, color: product.stockQuantity > 0 ? '#10B981' : '#F59E0B' }}>
                  Stok: {Number(product.stockQuantity).toLocaleString('tr-TR')}
                </Text>
              </View>
            </View>
          )}

          {isNew && (
            <>
              <Text caption1 grayColor style={styles.label}>
                Ürün adı
              </Text>
              <TextInput value={name} onChangeText={setName} placeholder="Örn. Ülker Çikolatalı Gofret 36 g" />
            </>
          )}

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text caption1 grayColor style={styles.label}>
                Satış fiyatı (₺)
              </Text>
              <TextInput
                value={price}
                onChangeText={setPrice}
                placeholder="0,00"
                keyboardType="decimal-pad"
                inputStyle={{ fontSize: 20, fontWeight: '700' }}
              />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text caption1 grayColor style={styles.label}>
                Adet
              </Text>
              <View style={[styles.stepper, { backgroundColor: colors.card }]}>
                <TouchableOpacity onPress={() => setQuantity((q) => Math.max(1, q - 1))} style={styles.stepButton}>
                  <Icon name="minus" size={14} color={colors.text} />
                </TouchableOpacity>
                <Text title3 bold style={{ minWidth: 28, textAlign: 'center' }}>
                  {quantity}
                </Text>
                <TouchableOpacity onPress={() => setQuantity((q) => q + 1)} style={styles.stepButton}>
                  <Icon name="plus" size={14} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {!isNew && product.salePrice == null && (
            <Text caption1 style={{ color: '#F59E0B', marginTop: 8 }}>
              Bu ürün için henüz satış fiyatı girilmemiş; gireceğiniz fiyat mağazanıza kaydedilir.
            </Text>
          )}

          {unitPrice != null && unitPrice > 0 && (
            <Text body1 bold style={{ marginTop: 12, textAlign: 'right' }}>
              Tutar: {fmt(unitPrice * quantity)}
            </Text>
          )}

          <View style={[styles.row, { marginTop: 16 }]}>
            <Button outline style={{ flex: 1, marginRight: 8 }} onPress={onRescan}>
              Tekrar Okut
            </Button>
            <Button style={{ flex: 1.4 }} onPress={submit} loading={saving} disabled={!canSubmit || saving}>
              {isNew ? 'Kaydet ve Ekle' : 'Sepete Ekle'}
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', marginBottom: 16 },
  header: { flexDirection: 'row', gap: 14, marginBottom: 8 },
  image: { width: 84, height: 84, borderRadius: 12 },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  label: { marginTop: 12, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  stepper: { flexDirection: 'row', alignItems: 'center', height: 46, borderRadius: 8, paddingHorizontal: 4 },
  stepButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
