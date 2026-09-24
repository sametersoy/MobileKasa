import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storeApi } from '@/api';

const SELECTED_KEY = 'mobilkasa.selectedStoreId';
const StoreContext = createContext(null);

// Kullanıcının şubeleri ve seçili şube. Seçim cihazda saklanır; oturum kapanınca sıfırlanır.
export function StoreProvider({ children }) {
  const token = useSelector((s) => s.auth?.token);
  const [stores, setStores] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const api = storeApi(token);
      await api.current(); // hiç şubesi olmayan kullanıcıya ilk şubeyi açar
      const list = await api.list();
      const saved = await AsyncStorage.getItem(SELECTED_KEY).catch(() => null);
      setStores(list);
      setSelectedId((current) => {
        const preferred = current ?? saved;
        return list.some((s) => s.id === preferred) ? preferred : list[0]?.id ?? null;
      });
    } catch (e) {
      setError(e.message ?? 'Şubeler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      reload();
    } else {
      setStores([]);
      setSelectedId(null);
      AsyncStorage.removeItem(SELECTED_KEY).catch(() => {});
    }
  }, [token, reload]);

  const selectStore = useCallback((id) => {
    setSelectedId(id);
    AsyncStorage.setItem(SELECTED_KEY, id).catch(() => {});
  }, []);

  const value = useMemo(() => {
    const store = stores.find((s) => s.id === selectedId) ?? null;
    return {
      stores,
      store,
      storeId: store?.id ?? null,
      // StoreRole: 0 Sahip, 1 Yönetici, 2 Kasiyer
      canManage: store ? store.role !== 2 : false,
      isOwner: store?.role === 0,
      loading,
      error,
      reload,
      selectStore,
      api: token ? storeApi(token) : null,
    };
  }, [stores, selectedId, loading, error, reload, selectStore, token]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);

export const ROLE_LABELS = { 0: 'Sahip', 1: 'Yönetici', 2: 'Kasiyer' };
