import { retailApi, type Store } from '@/lib/retail'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

const SELECTED_KEY = 'mobilkasa.selectedStoreId'

type StoreContextType = {
  stores: Store[]
  store: Store | null
  storeId: string | null
  canManage: boolean // Sahip veya Yönetici
  isOwner: boolean
  loading: boolean
  selectStore: (id: string) => void
  reload: () => Promise<Store[]>
}

const StoreContext = createContext<StoreContextType | null>(null)

// Kullanıcının şubeleri ve seçili şube (tarayıcıda saklanır)
export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [stores, setStores] = useState<Store[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(() => localStorage.getItem(SELECTED_KEY))
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      await retailApi.current() // hiç şubesi olmayan kullanıcıya ilk şubeyi açar
      const list = await retailApi.stores()
      setStores(list)
      setSelectedId((current) => (list.some((s) => s.id === current) ? current : (list[0]?.id ?? null)))
      return list
    } catch {
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const selectStore = useCallback((id: string) => {
    setSelectedId(id)
    localStorage.setItem(SELECTED_KEY, id)
  }, [])

  const value = useMemo(() => {
    const store = stores.find((s) => s.id === selectedId) ?? null
    return {
      stores,
      store,
      storeId: store?.id ?? null,
      canManage: store ? store.role !== 2 : false,
      isOwner: store?.role === 0,
      loading,
      selectStore,
      reload,
    }
  }, [stores, selectedId, loading, selectStore, reload])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export const useStore = () => {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
