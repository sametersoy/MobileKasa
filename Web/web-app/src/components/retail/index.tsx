import Icon from '@/components/wrappers/Icon'
import { useStore } from '@/context/StoreContext'
import { useState, type ReactNode } from 'react'
import { Badge, Card, CardBody, Dropdown, Spinner } from 'react-bootstrap'

// Sayfa başlığı: solda başlık/alt başlık, sağda aksiyonlar
export const RetailHeader = ({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) => (
  <div className="d-flex flex-wrap align-items-center gap-2 py-3">
    <div className="flex-grow-1">
      <h4 className="m-0">{title}</h4>
      {subtitle ? <div className="text-muted fs-sm mt-1">{subtitle}</div> : null}
    </div>
    <div className="d-flex flex-wrap align-items-center gap-2">{actions}</div>
  </div>
)

// Seçili şube; birden fazla şube varsa açılır menüyle değiştirilir.
// allowAll verilirse "Tüm şubeler" seçeneği eklenir — bu seçim aktif şubeyi değiştirmez, yalnızca sayfanın görünümünü birleşik yapar.
export const StoreSwitcher = ({
  allowAll = false,
  allSelected = false,
  onAllChange,
}: {
  allowAll?: boolean
  allSelected?: boolean
  onAllChange?: (all: boolean) => void
}) => {
  const { stores, store, selectStore, loading } = useStore()
  if (loading && !store) return <Spinner animation="border" size="sm" />
  if (!store) return null
  const showAll = allowAll && stores.length > 1
  const all = showAll && allSelected

  return (
    <Dropdown align="end">
      <Dropdown.Toggle variant={all ? 'primary' : 'light'} size="sm" disabled={stores.length < 2} className="d-flex align-items-center gap-1">
        <Icon icon={all ? 'stack-2' : 'building-store'} />
        <span className="text-truncate" style={{ maxWidth: 180 }}>
          {all ? 'Tüm şubeler' : store.name}
        </span>
      </Dropdown.Toggle>
      <Dropdown.Menu>
        {showAll && (
          <>
            <Dropdown.Item active={all} onClick={() => onAllChange?.(true)}>
              <Icon icon="stack-2" className="me-2" />
              Tüm şubeler <span className="text-muted fs-xs">({stores.length} şubenin toplamı)</span>
            </Dropdown.Item>
            <Dropdown.Divider />
          </>
        )}
        {stores.map((s) => (
          <Dropdown.Item
            key={s.id}
            active={!all && s.id === store.id}
            onClick={() => {
              selectStore(s.id)
              onAllChange?.(false)
            }}
          >
            <Icon icon="building-store" className="me-2" />
            {s.name}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  )
}

export const ProductThumb = ({ uri, size = 44 }: { uri?: string | null; size?: number }) => {
  const [failed, setFailed] = useState(false)
  const box = { width: size, height: size, borderRadius: 8, objectFit: 'contain' as const, background: '#fff', flexShrink: 0 }
  if (!uri || failed)
    return (
      <div className="d-flex align-items-center justify-content-center bg-light-subtle border" style={box}>
        <Icon icon="package" className="text-muted" style={{ fontSize: size * 0.45 }} />
      </div>
    )
  return <img src={uri} alt="" style={box} className="border" onError={() => setFailed(true)} loading="lazy" />
}

export const StatCard = ({ label, value, icon, variant = 'primary', hint }: { label: string; value: ReactNode; icon: string; variant?: string; hint?: ReactNode }) => (
  <Card className="h-100 mb-0">
    <CardBody className="d-flex align-items-center gap-3">
      <div className={`avatar-md flex-shrink-0 rounded d-flex align-items-center justify-content-center bg-${variant}-subtle text-${variant}`} style={{ width: 44, height: 44 }}>
        <Icon icon={icon} style={{ fontSize: 22 }} />
      </div>
      <div className="flex-grow-1 overflow-hidden">
        <div className="text-muted fs-sm text-truncate">{label}</div>
        <h4 className={`m-0 text-${variant === 'primary' ? 'body' : variant}`}>{value}</h4>
        {hint ? <div className="text-muted fs-xs">{hint}</div> : null}
      </div>
    </CardBody>
  </Card>
)

export const StockBadge = ({ variant, children }: { variant: string; children: ReactNode }) => (
  <Badge bg={`${variant}-subtle`} text={variant as never} className={`text-${variant} fs-xs`}>
    {children}
  </Badge>
)

export const EmptyState = ({ icon, title, message }: { icon: string; title: string; message?: ReactNode }) => (
  <div className="text-center text-muted py-5">
    <Icon icon={icon} style={{ fontSize: 44 }} />
    <h5 className="mt-3 mb-1 text-body">{title}</h5>
    {message ? <p className="mb-0 fs-sm">{message}</p> : null}
  </div>
)

export const NoPermission = ({ what }: { what: string }) => {
  const { store } = useStore()
  return <EmptyState icon="lock" title="Yetkiniz yok" message={`${what} ${store?.name ?? 'şube'} sahibi veya yöneticisi yapabilir.`} />
}
