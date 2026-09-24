import PageBreadcrumb from '@/components/PageBreadcrumb'
import BuildingSelect from '@/components/BuildingSelect'
import Icon from '@/components/wrappers/Icon'
import api from '@/lib/api'
import { useBuilding } from '@/context/BuildingContext'
import { useEffect, useState } from 'react'
import { Badge, Button, Card, CardBody, CardFooter, CardHeader, Col, Form, ListGroup, ListGroupItem, Modal, Row, Spinner } from 'react-bootstrap'

type Offer = { id: string; tenderId: string; companyName: string; contactEmail: string; contactPhone: string; amount: number; description: string; isAwarded: boolean; submittedAt: string }
type Tender = { id: string; title: string; description: string; deadline: string; status: number; offerCount: number; createdAt: string }

const STATUS_MAP = [
  { label: 'Açık', color: 'success' },
  { label: 'Kapalı', color: 'secondary' },
  { label: 'Tamamlandı', color: 'primary' },
]

const IhalelerPage = () => {
  const { selectedBuilding } = useBuilding()
  const [tenders, setTenders] = useState<Tender[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null)
  const [loading, setLoading] = useState(false)
  const [offersLoading, setOffersLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', deadline: '' })
  const [saving, setSaving] = useState(false)

  const fetchData = () => {
    if (!selectedBuilding) return
    setLoading(true)
    api.get<Tender[]>(`/buildings/${selectedBuilding.id}/tenders`)
      .then((r) => setTenders(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const fetchOffers = (tender: Tender) => {
    if (!selectedBuilding) return
    setSelectedTender(tender)
    setOffersLoading(true)
    api.get<{ tender: Tender; offers: Offer[] }>(`/buildings/${selectedBuilding.id}/tenders/${tender.id}`)
      .then((r) => setOffers(r.data.offers))
      .catch(() => setOffers([]))
      .finally(() => setOffersLoading(false))
  }

  useEffect(() => { fetchData() }, [selectedBuilding?.id])

  const handleSave = async () => {
    if (!selectedBuilding) return
    setSaving(true)
    try {
      await api.post(`/buildings/${selectedBuilding.id}/tenders`, form)
      setShowModal(false)
      setForm({ title: '', description: '', deadline: '' })
      fetchData()
    } catch {}
    setSaving(false)
  }

  const handleClose = async (tender: Tender) => {
    if (!selectedBuilding) return
    await api.patch(`/buildings/${selectedBuilding.id}/tenders/${tender.id}/close`).catch(() => {})
    fetchData()
  }

  const handleAward = async (offer: Offer) => {
    if (!selectedBuilding || !selectedTender) return
    await api.patch(`/buildings/${selectedBuilding.id}/tenders/${selectedTender.id}/offers/${offer.id}/award`).catch(() => {})
    fetchOffers(selectedTender)
    fetchData()
  }

  return (
    <>
      <PageBreadcrumb title="İhaleler" subtitle="İletişim" />

      <div className="d-flex align-items-center justify-content-between mb-3">
        <BuildingSelect />
        <Button size="sm" variant="primary" className="d-inline-flex align-items-center gap-1" onClick={() => setShowModal(true)} disabled={!selectedBuilding}>
          <Icon icon="plus" /> İhale Yayınla
        </Button>
      </div>

      <Row>
        <Col xs={12} lg={selectedTender ? 7 : 12}>
          <Card>

            {loading ? (
              <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
            ) : tenders.length === 0 ? (
              <CardBody className="text-center py-5 text-muted">
                <Icon icon="hammer" className="fs-1 mb-3" />
                <p>Henüz ihale yayınlanmamış</p>
              </CardBody>
            ) : (
              <>
                {tenders.map((t) => {
                  const st = STATUS_MAP[t.status] ?? { label: t.status, color: 'secondary' }
                  return (
                    <div key={t.id} className={`d-flex align-items-start gap-3 p-3 border-bottom cursor-pointer ${selectedTender?.id === t.id ? 'bg-primary-subtle' : ''}`} style={{ cursor: 'pointer' }} onClick={() => fetchOffers(t)}>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between">
                          <h6 className="mb-1">{t.title}</h6>
                          <Badge bg={st.color}>{st.label}</Badge>
                        </div>
                        <p className="text-muted fs-sm mb-1">{t.description}</p>
                        <small className="text-muted">Son teklif: {t.deadline} • {t.offerCount} teklif</small>
                      </div>
                      {t.status === 0 && (
                        <Button size="sm" variant="outline-secondary" onClick={(e) => { e.stopPropagation(); handleClose(t) }}>
                          Kapat
                        </Button>
                      )}
                    </div>
                  )
                })}
              </>
            )}
          </Card>
        </Col>

        {selectedTender && (
          <Col xs={12} lg={5}>
            <Card>
              <CardHeader className="border-light justify-content-between">
                <h6 className="mb-0">{selectedTender.title} — Teklifler</h6>
                <Button size="sm" variant="light" onClick={() => setSelectedTender(null)}>
                  <Icon icon="x" />
                </Button>
              </CardHeader>

              {offersLoading ? (
                <CardBody className="text-center py-4"><Spinner animation="border" size="sm" /></CardBody>
              ) : offers.length === 0 ? (
                <CardBody className="text-center py-4 text-muted fs-sm">Henüz teklif gelmemiş</CardBody>
              ) : (
                <ListGroup variant="flush">
                  {offers.map((o) => (
                    <ListGroupItem key={o.id} className={o.isAwarded ? 'bg-success-subtle' : ''}>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <p className="mb-0 fw-medium">{o.companyName}</p>
                          <small className="text-muted">{o.contactEmail} • {o.contactPhone}</small>
                          <p className="mb-0 text-success fw-bold mt-1">₺{o.amount.toLocaleString('tr-TR')}</p>
                          {o.description && <small className="text-muted">{o.description}</small>}
                        </div>
                        {o.isAwarded ? (
                          <Badge bg="success">Seçildi</Badge>
                        ) : selectedTender.status === 1 ? (
                          <Button size="sm" variant="success" onClick={() => handleAward(o)}>
                            <Icon icon="check" className="me-1" /> Seç
                          </Button>
                        ) : null}
                      </div>
                    </ListGroupItem>
                  ))}
                </ListGroup>
              )}
            </Card>
          </Col>
        )}
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Yeni İhale</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Başlık</Form.Label>
              <Form.Control value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="İhale başlığı" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Açıklama</Form.Label>
              <Form.Control as="textarea" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="İhale detayları" />
            </Form.Group>
            <Form.Group>
              <Form.Label>Son Teklif Tarihi</Form.Label>
              <Form.Control type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>İptal</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || !form.title || !form.deadline}>
            {saving ? <Spinner size="sm" animation="border" /> : 'Yayınla'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default IhalelerPage
