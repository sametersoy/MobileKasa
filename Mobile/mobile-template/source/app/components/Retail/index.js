import { useState } from 'react';
import {
  View,
  TouchableOpacity,
  TextInput as RNTextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  StyleSheet,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BaseColor, useTheme } from '@/config';
import { Text, Icon, TextInput } from '@/components';
import { useStore } from '@/context/StoreContext';

export { default as BarcodeScanner } from './BarcodeScanner';

export const COLORS = { success: '#10B981', warning: '#F59E0B', danger: '#EF4444', info: '#2563EB' };

// Stok sıfır/altındaysa kırmızı, minimum seviyede veya altındaysa (tüm şubelerde: herhangi bir şubede) turuncu
export const stockColor = (p) => {
  if (p.stockQuantity <= 0) return COLORS.danger;
  if (p.lowStock || (p.minStockLevel != null && p.stockQuantity <= p.minStockLevel)) return COLORS.warning;
  return COLORS.success;
};

// Ekran başlığı: geri butonu (isteğe bağlı), başlık, alt başlıkta seçili şube, sağda aksiyon
export function ScreenHeader({ title, subtitle, back = false, right = null, showStore = true }) {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { store } = useStore();
  const sub = subtitle ?? (showStore ? store?.name : null);
  return (
    <View style={styles.header}>
      {back && (
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12, padding: 4 }}>
          <Icon name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
      )}
      <View style={{ flex: 1 }}>
        <Text header bold numberOfLines={1}>
          {title}
        </Text>
        {sub ? (
          <Text caption1 grayColor style={{ marginTop: 2 }} numberOfLines={1}>
            {sub}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

export function HeaderButton({ icon, label, onPress, color }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.headerButton, { backgroundColor: color ?? colors.primary }]}>
      <Icon name={icon} size={13} color="#fff" />
      {label ? (
        <Text caption1 whiteColor bold style={{ marginLeft: 6 }}>
          {label}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

export function SearchInput({ value, onChangeText, placeholder = 'Ara', onScan }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.search, { backgroundColor: colors.card }]}>
      <Icon name="search" size={14} color={BaseColor.grayColor} />
      <RNTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={BaseColor.grayColor}
        style={[styles.searchInput, { color: colors.text }]}
        autoCorrect={false}
        returnKeyType="search"
      />
      {value ? (
        <TouchableOpacity onPress={() => onChangeText('')} style={styles.searchIcon}>
          <Icon name="times-circle" size={15} color={BaseColor.grayColor} />
        </TouchableOpacity>
      ) : null}
      {onScan ? (
        <TouchableOpacity onPress={onScan} style={styles.searchIcon}>
          <Icon name="barcode" size={18} color={colors.primary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function Chip({ label, active, onPress, icon }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, { backgroundColor: active ? colors.primary : colors.card }]}
    >
      {icon ? <Icon name={icon} size={11} color={active ? '#fff' : colors.text} style={{ marginRight: 6 }} /> : null}
      <Text caption1 bold={active} style={{ color: active ? '#fff' : colors.text }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function EmptyState({ icon, title, message }) {
  return (
    <View style={styles.empty}>
      <Icon name={icon} size={44} color={BaseColor.grayColor} />
      <Text title3 bold style={{ marginTop: 14, textAlign: 'center' }}>
        {title}
      </Text>
      {message ? (
        <Text body2 grayColor style={{ marginTop: 6, textAlign: 'center' }}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

export function StatCard({ label, value, icon, color }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: colors.card }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {icon ? <Icon name={icon} size={12} color={color ?? colors.primary} style={{ marginRight: 6 }} /> : null}
        <Text caption1 grayColor numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text title3 bold style={{ marginTop: 6, color: color ?? colors.text }} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export function ProductThumb({ uri, size = 52 }) {
  const [failed, setFailed] = useState(false);
  const box = { width: size, height: size, borderRadius: 8, backgroundColor: '#fff' };
  if (!uri || failed) {
    return (
      <View style={[box, styles.center, { backgroundColor: '#F3F4F6' }]}>
        <Icon name="box" size={size * 0.38} color={BaseColor.grayColor} />
      </View>
    );
  }
  return <Image source={{ uri }} style={box} resizeMode="contain" onError={() => setFailed(true)} />;
}

export function Field({ label, style, ...inputProps }) {
  return (
    <View style={style}>
      <Text caption1 grayColor style={{ marginTop: 12, marginBottom: 6 }}>
        {label}
      </Text>
      <TextInput {...inputProps} />
    </View>
  );
}

// Alttan açılan form/detay paneli
export function Sheet({ visible, title, onClose, children, footer }) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <Text title3 bold style={{ flex: 1 }}>
              {title}
            </Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Icon name="times" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 8 }}>
            {children}
          </ScrollView>
          {footer ? <View style={{ marginTop: 12 }}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Seçili şubeyi gösterir; birden fazla şube varsa dokununca değiştirme listesi açılır.
// allowAll verilirse listenin başına "Tüm şubeler" eklenir; bu seçim aktif şubeyi değiştirmez,
// yalnızca ekranın görünümünü (allSelected / onAllChange) birleşik yapar.
export function StoreSwitcher({ allowAll = false, allSelected = false, onAllChange }) {
  const { colors } = useTheme();
  const { stores, store, selectStore } = useStore();
  const [open, setOpen] = useState(false);
  if (!store) return null;
  const multiple = stores.length > 1;
  const showAll = allowAll && multiple;
  const all = showAll && allSelected;

  const Row = ({ selected, icon, title, subtitle, onPress }) => (
    <TouchableOpacity
      onPress={() => {
        onPress();
        setOpen(false);
      }}
      style={[styles.storeRow, { borderColor: selected ? colors.primary : colors.border }]}
    >
      <Icon name={icon} size={16} color={selected ? colors.primary : BaseColor.grayColor} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text body1 bold>
          {title}
        </Text>
        {subtitle ? (
          <Text caption1 grayColor numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {selected ? <Icon name="check-circle" size={18} color={colors.primary} /> : null}
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity
        disabled={!multiple}
        onPress={() => setOpen(true)}
        style={[styles.switcher, { backgroundColor: all ? colors.primary : colors.card }]}
      >
        <Icon name={all ? 'layer-group' : 'store'} size={12} color={all ? '#fff' : colors.primary} />
        <Text
          caption1
          bold
          style={{ marginHorizontal: 6, maxWidth: 140, color: all ? '#fff' : colors.text }}
          numberOfLines={1}
        >
          {all ? 'Tüm şubeler' : store.name}
        </Text>
        {multiple ? <Icon name="chevron-down" size={10} color={all ? '#fff' : colors.text} /> : null}
      </TouchableOpacity>
      <Sheet visible={open} title="Şube Seç" onClose={() => setOpen(false)}>
        {showAll && (
          <Row
            selected={all}
            icon="layer-group"
            title="Tüm şubeler"
            subtitle={`${stores.length} şubenin toplamı`}
            onPress={() => onAllChange(true)}
          />
        )}
        {stores.map((s) => (
          <Row
            key={s.id}
            selected={!all && s.id === store.id}
            icon="store"
            title={s.name}
            subtitle={s.address}
            onPress={() => {
              selectStore(s.id);
              if (showAll) onAllChange(false);
            }}
          />
        ))}
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginHorizontal: 16,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, paddingVertical: 0 },
  searchIcon: { padding: 6, marginLeft: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 17,
    marginRight: 8,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingVertical: 60 },
  stat: { flex: 1, borderRadius: 12, padding: 12 },
  center: { alignItems: 'center', justifyContent: 'center' },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32, maxHeight: '90%' },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', marginBottom: 12 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  switcher: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 32, borderRadius: 16 },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginTop: 10,
  },
});
