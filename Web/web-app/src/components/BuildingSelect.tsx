import { useBuilding } from '@/context/BuildingContext'
import { FormSelect, Spinner } from 'react-bootstrap'

const buildingTypeLabel = ['Apartman', 'Site']

const BuildingSelect = () => {
  const { buildings, selectedBuilding, setSelectedBuilding, loading } = useBuilding()

  if (loading) return <Spinner animation="border" size="sm" />

  if (buildings.length === 0)
    return <span className="text-muted fs-sm">Bina bulunamadı</span>

  return (
    <FormSelect
      size="sm"
      style={{ maxWidth: 260 }}
      value={selectedBuilding?.id ?? ''}
      onChange={(e) => {
        const b = buildings.find((x) => x.id === e.target.value)
        if (b) setSelectedBuilding(b)
      }}
    >
      {buildings.map((b) => (
        <option key={b.id} value={b.id}>
          {b.name} — {buildingTypeLabel[b.type] ?? b.type}
        </option>
      ))}
    </FormSelect>
  )
}

export default BuildingSelect
