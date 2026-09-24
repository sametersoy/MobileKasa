import Icon from '@/components/wrappers/Icon'
import { useAuth } from '@/hooks/useAuth'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { Badge, Button, Card, CardBody, CardHeader, Col, ListGroup, ListGroupItem, Row, Spinner } from 'react-bootstrap'
import { Link } from 'react-router'

type Building = { id: string; name: string; address: string; type: string }
type Unit = { id: string; number: string; floor: number; type: string; areaM2: number; isOccupied: boolean; building: Building }
type Dues = { id: string; period: string; amount: number; dueDate: string; isPaid: boolean; paidDate?: string; note?: string }
type Meter = { id: string; name: string; type: string; unit: string; lastReading?: number; lastReadingDate?: string }
type Notification = { id: string; title: string; body: string; type: string; isRead: boolean; createdAt: string }

type Dashboard = {
  unit: Unit
  unpaidDues: Dues[]
  meters: Meter[]
  recentNotifications: Notification[]
}

const unitTypeLabel: Record<string, string> = {
  Residential: 'Konut',
  Commercial: 'İşyeri',
  Parking: 'Otopark',
}

const meterTypeIcon: Record<string, string> = {
  Electric: 'bolt',
  Gas: 'flame',
  Water: 'droplet',
}

const SakinPanel = () => {
  const { userInfo, logout } = useAuth()
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = sessionStorage.getItem('token')?.replace(/^"|"$/g, '')
    axios
      .get('/api/web/resident/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => setDashboard(r.data))
      .catch(() => setError('Daire bilgileri yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="container-fluid py-4 px-3 px-md-4" style={{ maxWidth: 960 }}>
      {/* Üst Bar */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-0">Hoş Geldiniz, {userInfo?.unique_name ?? 'Sakin'}</h4>
          <p className="text-muted mb-0 fs-sm">Daire Paneli</p>
        </div>
        <Button variant="outline-secondary" size="sm" onClick={logout}>
          <Icon icon="logout" className="me-1" /> Çıkış
        </Button>
      </div>

      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">Yükleniyor…</p>
        </div>
      )}

      {error && !loading && (
        <Card className="border-warning">
          <CardBody className="text-center py-5">
            <Icon icon="building-off" className="fs-1 text-muted mb-3" />
            <h5>Bilgi Alınamadı</h5>
            <p className="text-muted mb-3">{error}</p>
            <p className="text-muted fs-sm">
              Yöneticinizin sizi bir daireye tanımlaması gerekiyor. Lütfen yöneticinize başvurun.
            </p>
          </CardBody>
        </Card>
      )}

      {dashboard && !loading && (
        <Row className="g-3">
          {/* Daire & Bina Bilgisi */}
          <Col md={6}>
            <Card className="h-100">
              <CardHeader>
                <h6 className="card-title mb-0">
                  <Icon icon="home" className="me-2 text-primary" />
                  Daire Bilgileri
                </h6>
              </CardHeader>
              <CardBody>
                <Row className="g-2">
                  <Col xs={6}>
                    <p className="text-muted fs-xs mb-1">Bina</p>
                    <p className="fw-semibold mb-0">{dashboard.unit.building.name}</p>
                  </Col>
                  <Col xs={6}>
                    <p className="text-muted fs-xs mb-1">Adres</p>
                    <p className="fw-semibold mb-0 text-truncate" title={dashboard.unit.building.address}>
                      {dashboard.unit.building.address}
                    </p>
                  </Col>
                  <Col xs={4}>
                    <p className="text-muted fs-xs mb-1">Daire No</p>
                    <p className="fw-semibold mb-0">{dashboard.unit.number}</p>
                  </Col>
                  <Col xs={4}>
                    <p className="text-muted fs-xs mb-1">Kat</p>
                    <p className="fw-semibold mb-0">{dashboard.unit.floor}</p>
                  </Col>
                  <Col xs={4}>
                    <p className="text-muted fs-xs mb-1">Alan</p>
                    <p className="fw-semibold mb-0">{dashboard.unit.areaM2} m²</p>
                  </Col>
                  <Col xs={12}>
                    <p className="text-muted fs-xs mb-1">Tip</p>
                    <Badge bg="light" text="dark">{unitTypeLabel[dashboard.unit.type] ?? dashboard.unit.type}</Badge>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>

          {/* Ödenmemiş Aidatlar */}
          <Col md={6}>
            <Card className="h-100">
              <CardHeader className="d-flex justify-content-between align-items-center">
                <h6 className="card-title mb-0">
                  <Icon icon="credit-card" className="me-2 text-warning" />
                  Bekleyen Aidatlar
                </h6>
                {dashboard.unpaidDues.length > 0 && (
                  <Badge bg="danger">{dashboard.unpaidDues.length}</Badge>
                )}
              </CardHeader>
              <CardBody className="p-0">
                {dashboard.unpaidDues.length === 0 ? (
                  <div className="text-center py-4">
                    <Icon icon="circle-check" className="fs-2xl text-success mb-2" />
                    <p className="text-muted mb-0 fs-sm">Tüm aidatlar ödenmiş</p>
                  </div>
                ) : (
                  <ListGroup variant="flush">
                    {dashboard.unpaidDues.map((d) => (
                      <ListGroupItem key={d.id} className="d-flex justify-content-between align-items-center">
                        <div>
                          <p className="mb-0 fw-medium">{d.period}</p>
                          <small className="text-muted">Son ödeme: {d.dueDate}</small>
                        </div>
                        <span className="fw-bold text-danger">₺{d.amount.toLocaleString('tr-TR')}</span>
                      </ListGroupItem>
                    ))}
                  </ListGroup>
                )}
              </CardBody>
            </Card>
          </Col>

          {/* Sayaçlar */}
          <Col md={6}>
            <Card>
              <CardHeader>
                <h6 className="card-title mb-0">
                  <Icon icon="gauge" className="me-2 text-info" />
                  Sayaçlarım
                </h6>
              </CardHeader>
              <CardBody className="p-0">
                {dashboard.meters.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted fs-sm mb-0">Kayıtlı sayaç yok</p>
                  </div>
                ) : (
                  <ListGroup variant="flush">
                    {dashboard.meters.map((m) => (
                      <ListGroupItem key={m.id}>
                        <div className="d-flex align-items-center gap-3">
                          <span className="avatar-sm">
                            <span className="avatar-title bg-info-subtle text-info rounded-circle fs-18">
                              <Icon icon={meterTypeIcon[m.type] ?? 'gauge'} />
                            </span>
                          </span>
                          <div className="flex-grow-1">
                            <p className="mb-0 fw-medium">{m.name}</p>
                            <small className="text-muted">
                              {m.lastReading != null
                                ? `Son okuma: ${m.lastReading} ${m.unit}`
                                : 'Okuma kaydı yok'}
                            </small>
                          </div>
                        </div>
                      </ListGroupItem>
                    ))}
                  </ListGroup>
                )}
              </CardBody>
            </Card>
          </Col>

          {/* Bildirimler */}
          <Col md={6}>
            <Card>
              <CardHeader>
                <h6 className="card-title mb-0">
                  <Icon icon="bell" className="me-2 text-primary" />
                  Son Bildirimler
                </h6>
              </CardHeader>
              <CardBody className="p-0">
                {dashboard.recentNotifications.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted fs-sm mb-0">Bildirim yok</p>
                  </div>
                ) : (
                  <ListGroup variant="flush">
                    {dashboard.recentNotifications.slice(0, 5).map((n) => (
                      <ListGroupItem key={n.id} className={n.isRead ? '' : 'bg-primary-subtle'}>
                        <div className="d-flex gap-2">
                          {!n.isRead && (
                            <span className="badge bg-primary rounded-circle mt-1" style={{ width: 8, height: 8, padding: 0 }}>&nbsp;</span>
                          )}
                          <div>
                            <p className="mb-0 fw-medium fs-sm">{n.title}</p>
                            <p className="mb-0 text-muted fs-xs">{n.body}</p>
                            <small className="text-muted fs-xs">
                              {new Date(n.createdAt).toLocaleDateString('tr-TR')}
                            </small>
                          </div>
                        </div>
                      </ListGroupItem>
                    ))}
                  </ListGroup>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  )
}

export default SakinPanel
