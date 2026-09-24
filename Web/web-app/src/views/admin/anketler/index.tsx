import PageBreadcrumb from '@/components/PageBreadcrumb'
import BuildingSelect from '@/components/BuildingSelect'
import Icon from '@/components/wrappers/Icon'
import api from '@/lib/api'
import { useBuilding } from '@/context/BuildingContext'
import { useEffect, useState } from 'react'
import { Badge, Button, Card, CardBody, CardHeader, Col, Form, Modal, ProgressBar, Row, Spinner } from 'react-bootstrap'

type PollOption = { id: string; text: string; voteCount: number }
type Poll = { id: string; question: string; description: string; startDate: string; endDate: string; isActive: boolean; options: PollOption[]; totalVotes: number; createdAt: string }

const AnketlerPage = () => {
  const { selectedBuilding } = useBuilding()
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ question: '', description: '', startDate: '', endDate: '', options: ['', ''] })
  const [saving, setSaving] = useState(false)

  const fetchData = () => {
    if (!selectedBuilding) return
    setLoading(true)
    api.get<Poll[]>(`/buildings/${selectedBuilding.id}/polls`)
      .then((r) => setPolls(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [selectedBuilding?.id])

  const handleSave = async () => {
    if (!selectedBuilding) return
    setSaving(true)
    try {
      const options = form.options.filter((o) => o.trim())
      await api.post(`/buildings/${selectedBuilding.id}/polls`, { ...form, options })
      setShowModal(false)
      setForm({ question: '', description: '', startDate: '', endDate: '', options: ['', ''] })
      fetchData()
    } catch {}
    setSaving(false)
  }

  const handleVote = async (poll: Poll, optionId: string) => {
    if (!selectedBuilding) return
    await api.post(`/buildings/${selectedBuilding.id}/polls/${poll.id}/vote`, { pollOptionId: optionId }).catch(() => {})
    fetchData()
  }

  const addOption = () => setForm({ ...form, options: [...form.options, ''] })
  const removeOption = (i: number) => setForm({ ...form, options: form.options.filter((_, idx) => idx !== i) })
  const updateOption = (i: number, val: string) => {
    const opts = [...form.options]
    opts[i] = val
    setForm({ ...form, options: opts })
  }

  return (
    <>
      <PageBreadcrumb title="Anketler" subtitle="İletişim" />

      <div className="d-flex align-items-center justify-content-between mb-3">
        <BuildingSelect />
        <Button size="sm" variant="primary" className="d-inline-flex align-items-center gap-1" onClick={() => setShowModal(true)} disabled={!selectedBuilding}>
          <Icon icon="plus" /> Anket Oluştur
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
      ) : polls.length === 0 ? (
        <Card>
          <CardBody className="text-center py-5 text-muted">
            <Icon icon="clipboard-list" className="fs-1 mb-3" />
            <p>Henüz anket oluşturulmamış</p>
          </CardBody>
        </Card>
      ) : (
        <Row className="g-3">
          {polls.map((poll) => (
            <Col md={6} xl={4} key={poll.id}>
              <Card className="h-100">
                <CardHeader className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="mb-1">{poll.question}</h6>
                    <small className="text-muted">{poll.description}</small>
                  </div>
                  <Badge bg={poll.isActive ? 'success' : 'secondary'}>{poll.isActive ? 'Aktif' : 'Bitti'}</Badge>
                </CardHeader>
                <CardBody>
                  <p className="text-muted fs-xs mb-3">
                    {new Date(poll.startDate).toLocaleDateString('tr-TR')} – {new Date(poll.endDate).toLocaleDateString('tr-TR')} • {poll.totalVotes} oy
                  </p>
                  {poll.options.map((opt) => {
                    const pct = poll.totalVotes > 0 ? Math.round((opt.voteCount / poll.totalVotes) * 100) : 0
                    return (
                      <div key={opt.id} className="mb-2">
                        <div className="d-flex justify-content-between mb-1">
                          <span className="fs-sm">{opt.text}</span>
                          <span className="fs-xs text-muted">{opt.voteCount} ({pct}%)</span>
                        </div>
                        <ProgressBar now={pct} style={{ height: 6 }} />
                      </div>
                    )
                  })}
                  {poll.isActive && (
                    <div className="mt-3 d-flex flex-wrap gap-2">
                      {poll.options.map((opt) => (
                        <Button key={opt.id} size="sm" variant="outline-primary" onClick={() => handleVote(poll, opt.id)}>
                          {opt.text}
                        </Button>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Yeni Anket</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Soru</Form.Label>
              <Form.Control value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="Anket sorusu" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Açıklama</Form.Label>
              <Form.Control as="textarea" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Form.Group>
            <Row className="g-3 mb-3">
              <Col xs={6}>
                <Form.Group>
                  <Form.Label>Başlangıç</Form.Label>
                  <Form.Control type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group>
                  <Form.Label>Bitiş</Form.Label>
                  <Form.Control type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </Form.Group>
              </Col>
            </Row>
            <div>
              <Form.Label>Seçenekler</Form.Label>
              {form.options.map((opt, i) => (
                <div key={i} className="d-flex gap-2 mb-2">
                  <Form.Control value={opt} onChange={(e) => updateOption(i, e.target.value)} placeholder={`Seçenek ${i + 1}`} />
                  {form.options.length > 2 && (
                    <Button size="sm" variant="light" onClick={() => removeOption(i)}>
                      <Icon icon="x" />
                    </Button>
                  )}
                </div>
              ))}
              {form.options.length < 6 && (
                <Button size="sm" variant="outline-secondary" className="d-inline-flex align-items-center gap-1" onClick={addOption}>
                  <Icon icon="plus" /> Seçenek Ekle
                </Button>
              )}
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>İptal</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || !form.question || !form.startDate || !form.endDate}>
            {saving ? <Spinner size="sm" animation="border" /> : 'Oluştur'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default AnketlerPage
