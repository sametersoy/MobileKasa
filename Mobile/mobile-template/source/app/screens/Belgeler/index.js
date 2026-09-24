import { useCallback, useEffect, useState } from 'react';
import { FlatList, View, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { BaseColor, BaseStyle, useTheme } from '@/config';
import { SafeAreaView, Text, Icon, Transaction2Col } from '@/components';
import { webApi } from '@/api';

const CATEGORIES = ['Genel', 'Sözleşme', 'Fatura', 'Toplantı', 'Hukuki'];
const CAT_COLORS = ['#6B7280', '#06B6D4', '#F59E0B', '#6366F1', '#EF4444'];

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function Belgeler() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const token = useSelector((s) => s.auth?.token);
  const selectedBuildingId = useSelector((s) => s.building?.selectedId);
  const buildingList = useSelector((s) => s.building?.list ?? []);
  const buildingId = selectedBuildingId;
  const buildingName = buildingList.find((b) => b.id === selectedBuildingId)?.name ?? '';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token || !buildingId) { setLoading(false); setRefreshing(false); return; }
    try {
      const res = await webApi(token).documents(buildingId);
      setItems(res ?? []);
    } catch (e) {
      console.warn('[Belgeler] load error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, buildingId]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const handleDelete = (item) => {
    Alert.alert('Sil', `"${item.name}" silinsin mi?`, [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => {
        try { await webApi(token).delDocument(buildingId, item.id); load(); }
        catch (e) { Alert.alert('Hata', e.message); }
      }},
    ]);
  };

  return (
    <SafeAreaView style={BaseStyle.safeAreaView} edges={['right', 'top', 'left']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Icon name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text header bold>Belgeler</Text>
          {buildingName ? <Text caption1 grayColor style={{ marginTop: 2 }}>{buildingName}</Text> : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: BaseColor.fieldColor, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 }}>
          <Icon name="info-circle" size={13} color={BaseColor.grayColor} />
          <Text caption1 grayColor>Web'den yükleyin</Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl colors={[colors.primary]} tintColor={colors.primary} refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Icon name="folder-open" size={48} color={BaseColor.grayColor} />
              <Text body1 grayColor style={{ marginTop: 12 }}>Belge bulunamadı.</Text>
              <Text caption1 grayColor style={{ marginTop: 6, textAlign: 'center', paddingHorizontal: 40 }}>Belge yüklemek için web panelini kullanın.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Transaction2Col
                  icon="file-alt"
                  name={item.name}
                  date={`${new Date(item.uploadedAt).toLocaleDateString('tr-TR')} · ${formatSize(item.fileSizeBytes)}`}
                  status=""
                  price={CATEGORIES[item.category] ?? 'Genel'}
                  isUp={true}
                  backgroundIcon={CAT_COLORS[item.category] ?? BaseColor.grayColor}
                  style={{ paddingHorizontal: 20 }}
                  onPress={() => Alert.alert('Bilgi', 'Belge indirmek için web panelini kullanın.')}
                />
              </View>
              <TouchableOpacity onPress={() => handleDelete(item)} style={{ paddingHorizontal: 14, paddingVertical: 20 }}>
                <Icon name="trash" size={15} color={BaseColor.grayColor} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
