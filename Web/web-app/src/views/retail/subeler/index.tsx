import PageMetaData from '@/components/PageMetaData'
import Icon from '@/components/wrappers/Icon'
import { RetailHeader } from '@/components/retail'
import { useStore } from '@/context/StoreContext'
import { useNotificationContext } from '@/context/useNotificationContext'
import { errorMessage, retailApi, ROLE_LABELS, type Store, type StoreMember, type StoreRole } from '@/lib/retail'
import { useEffect, useState } from 'react'
import { Badge, Button, ButtonGroup, Card, CardBody, CardFooter, Col, Form, Modal, Row, Spinner, Table } from 'react-bootstrap'

type StoreForm = { id?: string; role?: StoreRole; name: string; address: string; phone: string; taxNumber: string }
const EMPTY: StoreForm = { name: '', address: '', phone: '', taxNumber: '' }

const SubelerPage = () => {
  const { stores, store, selectStore, reload } = useStore()
  const { showNotification } = useNotificationContext()
  const [editing, setEditing] = useState<StoreForm | null>(null)
  const [confirmClose, setConfirmClose] = useState(false)
  const [saving, setSaving] = useState(false)

  const ownerCount = stores.filter((s) => s.role === 0).length

  const openEdit = (s: Store) =>
    setEditing({ id: s.id, role: s.role, name: s.name, address: s.address ?? '', phone: s.phone ?? '', taxNumber: s.taxNumber ?? '' })

  const set = (key: keyof StoreForm) => (e: React.ChangeEvent<HTMLInputElement>) => setEditing((f) => (f ? { ...f, [key]: e.target.value } : f))

  const save = async () => {
    if (!editing) return
    if (!editing.name.trim()) return showNotification({ message: 'Şube adı zorunlu.', variant: 'warning' })
    setSaving(true)
    try {
      const body = { name: editing.name, address: editing.address, phone: editing.phone, taxNumber: editing.taxNumber }
      const saved = editing.id ? await retailApi.updateStore(editing.id, body) : await retailApi.createStore(body)
      await reload()
      if (!editing.id) selectStore(saved.id)
      setEditing(null)
      showNotification({ message: editing.id ? 'Şube güncellendi.' : 'Yeni şube açıldı ve aktif şube yapıldı.', variant: 'success' })
    } catch (e) {
      showNotification({ message: errorMessage(e, 'Kaydedilemedi.'), variant: 'danger' })
    } finally {
      setSaving(false)
    }
  }

  const closeStore = async () => {
    if (!editing?.id) return
    try {
      await retailApi.deactivateStore(editing.id)
      setConfirmClose(false)
      setEditing(null)
      await reload()
      showNotification({ message: 'Şube kapatıldı.', variant: 'success' })
    } catch (e) {
      showNotification({ message: errorMessage(e), variant: 'danger' })
    }
  }

  return (
    <>
      <PageMetaData title="Şubeler" />
      <RetailHeader
        title="Şubeler"
        subtitle={`${stores.length} şube`}
        actions={
          <Button size="sm" onClick={() => setEditing({ ...EMPTY })}>
            <Icon icon="plus" className="me-1" /> Yeni Şube
          </Button>
        }
      />

      <Row className="g-3">
        {stores.map((s) => {
          const current = s.id === store?.id
          return (
            <Col md={6} xl={4} key={s.id}>
              <Card className={`h-100 mb-0 ${current ? 'border border-primary' : ''}`}>
                <CardBody className="d-flex gap-3">
                  <div
                    className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${current ? 'bg-primary text-white' : 'bg-light text-muted'}`}
                    style={{ width: 44, height: 44 }}
                  >
                    <Icon icon="building-store" style={{ fontSize: 20 }} />
                  </div>
                  <div className="flex-grow-1 overflow-hidden">
                    <h5 className="mb-1">
                      {s.name}
                      {current && (
                        <Badge bg="primary" className="ms-2 fs-xxs">
                          Aktif
                        </Badge>
                      )}
                    </h5>
                    <div className="text-muted fs-sm">{ROLE_LABELS[s.role]}</div>
                    {s.address && <div className="text-muted fs-sm text-truncate">{s.address}</div>}
                    {s.phone && <div className="text-muted fs-sm">{s.phone}</div>}
                  </div>
                </CardBody>
                <CardFooter className="d-flex gap-2">
                  {!current && (
                    <Button size="sm" variant="outline-primary" onClick={() => selectStore(s.id)}>
                      Bu şubeye geç
                    </Button>
                  )}
                  {s.role !== 2 && (
                    <Button size="sm" variant="light" onClick={() => openEdit(s)}>
                      <Icon icon="settings" className="me-1" />
                      {s.role === 0 ? 'Bilgiler ve çalışanlar' : 'Şube bilgileri'}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </Col>
          )
        })}
      </Row>

      <Modal show={!!editing} onHide={() => setEditing(null)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editing?.id ? editing.name || 'Şube' : 'Yeni Şube'}</Modal.Title>
        </Modal.Header>
        {editing && (
          <Modal.Body>
            <Row className="g-3">
              <Col md={12}>
                <Form.Label>Şube adı *</Form.Label>
                <Form.Control autoFocus value={editing.name} onChange={set('name')} placeholder="Örn. Merkez Şube" />
              </Col>
              <Col md={12}>
                <Form.Label>Adres</Form.Label>
                <Form.Control value={editing.address} onChange={set('address')} />
              </Col>
              <Col md={6}>
                <Form.Label>Telefon</Form.Label>
                <Form.Control value={editing.phone} onChange={set('phone')} />
              </Col>
              <Col md={6}>
                <Form.Label>Vergi no</Form.Label>
                <Form.Control value={editing.taxNumber} onChange={set('taxNumber')} />
              </Col>
            </Row>
            {editing.id && editing.role === 0 && <Members storeId={editing.id} />}
          </Modal.Body>
        )}
        <Modal.Footer className="justify-content-between">
          <div>
            {editing?.id && editing.role === 0 && ownerCount > 1 && (
              <Button variant="outline-danger" onClick={() => setConfirmClose(true)}>
                Şubeyi Kapat
              </Button>
            )}
          </div>
          <div className="d-flex gap-2">
            <Button variant="light" onClick={() => setEditing(null)}>
              Vazgeç
            </Button>
            <Button disabled={saving} onClick={save}>
              {saving ? 'Kaydediliyor…' : 'Kaydet'}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      <Modal show={confirmClose} onHide={() => setConfirmClose(false)} centered>
        <Modal.Body>
          <strong>{editing?.name}</strong> kapatılsın mı? Satış ve stok kayıtları silinmez ama şube listeden kalkar.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setConfirmClose(false)}>
            Vazgeç
          </Button>
          <Button variant="danger" onClick={closeStore}>
            Kapat
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

// Şube çalışanları: sahip, kayıtlı kullanıcıları e-posta ile kasiyer/yönetici olarak ekler
const Members = ({ storeId }: { storeId: string }) => {
  const { showNotification } = useNotificationContext()
  const [members, setMembers] = useState<StoreMember[] | null>(null)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<StoreRole>(2)
  const [adding, setAdding] = useState(false)

  const load = () =>
    retailApi
      .members(storeId)
      .then(setMembers)
      .catch(() => setMembers([]))

  useEffect(() => {
    load()
  }, [storeId])

  const add = async () => {
    if (!email.trim()) return
    setAdding(true)
    try {
      await retailApi.addMember(storeId, { email: email.trim(), role })
      setEmail('')
      showNotification({ message: 'Çalışan eklendi.', variant: 'success' })
      load()
    } catch (e) {
      showNotification({ message: errorMessage(e, 'Eklenemedi.'), variant: 'danger' })
    } finally {
      setAdding(false)
    }
  }

  const remove = async (m: StoreMember) => {
    try {
      await retailApi.removeMember(storeId, m.userId)
      load()
    } catch (e) {
      showNotification({ message: errorMessage(e), variant: 'danger' })
    }
  }

  return (
    <div className="mt-4">
      <h5>Çalışanlar</h5>
      {members == null ? (
        <Spinner animation="border" size="sm" />
      ) : (
        <Table size="sm" className="align-middle">
          <tbody>
            {members.map((m) => (
              <tr key={m.userId}>
                <td className="fw-semibold">{m.fullName}</td>
                <td className="text-muted">{m.email}</td>
                <td>
                  <Badge bg="light" text="dark">
                    {ROLE_LABELS[m.role]}
                  </Badge>
                </td>
                <td className="text-end">
                  {m.role !== 0 && (
                    <Button size="sm" variant="link" className="text-danger p-0" onClick={() => remove(m)} title="Şubeden çıkar">
                      <Icon icon="user-minus" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <Row className="g-2 align-items-end">
        <Col md={6}>
          <Form.Label>Çalışan ekle (kayıtlı e-posta)</Form.Label>
          <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="kasiyer@ornek.com" />
        </Col>
        <Col md={4}>
          <ButtonGroup className="w-100">
            <Button variant={role === 2 ? 'primary' : 'light'} onClick={() => setRole(2)}>
              Kasiyer
            </Button>
            <Button variant={role === 1 ? 'primary' : 'light'} onClick={() => setRole(1)}>
              Yönetici
            </Button>
          </ButtonGroup>
        </Col>
        <Col md={2}>
          <Button className="w-100" disabled={adding || !email.trim()} onClick={add}>
            Ekle
          </Button>
        </Col>
      </Row>
      <div className="text-muted fs-xs mt-2">Kasiyer satış yapabilir; yönetici ayrıca fiyat, stok girişi ve tedarikçileri yönetebilir.</div>
    </div>
  )
}

export default SubelerPage
