import api from '@/lib/api'
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

type Building = { id: string; name: string; address: string; type: number; unitCount: number }

type BuildingContextType = {
  buildings: Building[]
  selectedBuilding: Building | null
  setSelectedBuilding: (b: Building) => void
  loading: boolean
  refresh: () => void
}

const BuildingContext = createContext<BuildingContextType | null>(null)

export const BuildingProvider = ({ children }: { children: React.ReactNode }) => {
  const [buildings, setBuildings] = useState<Building[]>([])
  const [selectedBuilding, setSelectedBuildingState] = useState<Building | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchBuildings = useCallback(() => {
    setLoading(true)
    api
      .get<Building[]>('/buildings')
      .then((r) => {
        setBuildings(r.data)
        setSelectedBuildingState((prev) => {
          if (prev) {
            const still = r.data.find((b) => b.id === prev.id)
            return still ?? r.data[0] ?? null
          }
          return r.data[0] ?? null
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchBuildings()
  }, [fetchBuildings])

  const setSelectedBuilding = (b: Building) => setSelectedBuildingState(b)

  return (
    <BuildingContext.Provider value={{ buildings, selectedBuilding, setSelectedBuilding, loading, refresh: fetchBuildings }}>
      {children}
    </BuildingContext.Provider>
  )
}

export const useBuilding = () => {
  const ctx = useContext(BuildingContext)
  if (!ctx) throw new Error('useBuilding must be used within BuildingProvider')
  return ctx
}
