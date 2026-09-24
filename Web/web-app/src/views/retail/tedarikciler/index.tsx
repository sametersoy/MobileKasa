import PageMetaData from '@/components/PageMetaData'
import Icon from '@/components/wrappers/Icon'
import { EmptyState, RetailHeader, StoreSwitcher } from '@/components/retail'
import { useStore } from '@/context/StoreContext'
import { useNotificationContext } from '@/context/useNotificationContext'
import { fmt } from '@/lib/format'
import { errorMessage, retailApi, type Supplier, type SupplierInput } from '@/lib/retail'
import { useCallback, useEffect, useState } from 'react'
import { Button, Card, CardBody, CardHeader, Col, Form, InputGroup, Modal, Row, Spinner, Table } from 'react-bootstrap'
import { Link } from 'react-router'

const EMPTY: SupplierInput = { name: '', contactName: '', phone: '', email: '', taxNumber: '', address: '', note: '' }

const TedarikcilerPage = () => {
  const { storeId, canManage } = useStore()
  const { showNotification } = useNotificationContext()
  const [items, setItems] = useState<Supplier[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<(SupplierInput & { id?: string }) | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!storeId) return
    try {
      setItems(await retailApi.suppliers(storeId, { q: query.trim() || undefined }))
    } catch (e) {
      showNotification({ message: errorMessage(e, 'Tedarikçiler yüklenemedi.'), variant: 'danger' })
    } finally {
      setLoading(false)
    }
  }, [storeId, query])

  useEffect(() => {
    const timer = window.setTimeout(load, 250)
    return () => clearTimeout(timer)
  }, [load])

  const set = (key: keyof SupplierInput) => (e: React.ChangeEvent<HTMLInputElement>) => setEditing((f) => (f ? { ...f, [key]: e.target.value } : f))

  const save = async () => {
    if (!storeId || !editing) return
    if (!editing.name.trim()) return showNotification({ message: 'Tedarikçi adı zorunlu.', variant: 'warning' })
    setSaving(true)
    try {
      const { id, ...body } = editing
      if (id) await retailApi.updateSupplier(storeId, id, body)
      else await retailApi.createSupplier(storeId, body)
      setEditing(null)
      showNotification({ message: 'Tedarikçi kaydedildi.', variant: 'success' })
      load()
    } catch (e) {
      showNotification({ message: errorMessage(e, 'Kaydedilemedi.'), variant: 'danger' })
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!storeId || !editing?.id) return
    try {
      await retailApi.deleteSupplier(storeId, editing.id)
      setConfirmDelete(false)
      setEditing(null)
      showNotification({ message: 'Tedarikçi kaldırıldı. Geçmiş stok girişleri korunur.', variant: 'success' })
      load()
    } catch (e) {
      showNotification({ message: errorMessage(e), variant: 'danger' })
    }
  }

  const openEdit = (s: Supplier) =>
    setEditing({
      id: s.id,
      name: s.name,
      contactName: s.contactName ?? '',
      phone: s.phone ?? '',
      email: s.email ?? '',
      taxNumber: s.taxNumber ?? '',
      address: s.address ?? '',
      note: s.note ?? '',
    })

  return (
    <>
      <PageMetaData title="Tedarikçiler" />
      <RetailHeader
        title="Tedarikçiler"
        subtitle="Ürün aldığınız firmalar"
        actions={
          <>
            {canManage && (
              <Button size="sm" onClick={() => setEditing({ ...EMPTY })}>
                <Icon icon="plus" className="me-1" /> Tedarikçi Ekle
              </Button>
            )}
            <StoreSwitcher />
          </>
        }
      />

      <Card>
        <CardHeader className="border-light">
          <InputGroup style={{ maxWidth: 360 }}>
            <InputGroup.Text className="bg-light">
              <Icon icon="search" />
            </InputGroup.Text>
            <Form.Control value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tedarikçi ara" />
          </InputGroup>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState icon="truck" title="Tedarikçi yok" message={canManage ? 'Ürün aldığınız firmaları ekleyin; stok girişinde seçebilirsiniz.' : undefined} />
          ) : (
            <Table hover responsive className="align-middle mb-0">
              <thead className="bg-light-subtle">
                <tr className="text-uppercase fs-xxs">
                  <th>Firma</th>
                  <th>Yetkili</th>
                  <th>Telefon</th>
                  <th>E-posta</th>
                  <th className="text-center">Alış</th>
                  <th className="text-end">Toplam alış</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="fw-semibold">{s.name}</div>
                      {s.note && <div className="text-muted fs-xs">{s.note}</div>}
                    </td>
                    <td>{s.contactName ?? '—'}</td>
                    <td>{s.phone ? <a href={`tel:${s.phone.replace(/\s/g, '')}`}>{s.phone}</a> : '—'}</td>
                    <td>{s.email ? <a href={`mailto:${s.email}`}>{s.email}</a> : '—'}</td>
                    <td className="text-center">
                      <Link to={`/stok-girisleri?supplierId=${s.id}`}>{s.purchaseCount}</Link>
                    </td>
                    <td className="text-end fw-semibold">{fmt(s.purchaseTotal)}</td>
                    <td className="text-end">
                      {canManage && (
                        <Button size="sm" variant="light" onClick={() => openEdit(s)}>
                          <Icon icon="edit" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Modal show={!!editing} onHide={() => setEditing(null)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editing?.id ? 'Tedarikçiyi Düzenle' : 'Yeni Tedarikçi'}</Modal.Title>
        </Modal.Header>
        {editing && (
          <Modal.Body>
            <Row className="g-3">
              <Col md={12}>
                <Form.Label>Firma adı *</Form.Label>
                <Form.Control autoFocus value={editing.name} onChange={set('name')} placeholder="Örn. Anadolu Gıda Toptan" />
              </Col>
              <Col md={6}>
                <Form.Label>Yetkili</Form.Label>
                <Form.Control value={editing.contactName} onChange={set('contactName')} />
              </Col>
              <Col md={6}>
                <Form.Label>Telefon</Form.Label>
                <Form.Control value={editing.phone} onChange={set('phone')} />
              </Col>
              <Col md={6}>
                <Form.Label>E-posta</Form.Label>
                <Form.Control type="email" value={editing.email} onChange={set('email')} />
              </Col>
              <Col md={6}>
                <Form.Label>Vergi no</Form.Label>
                <Form.Control value={editing.taxNumber} onChange={set('taxNumber')} />
              </Col>
              <Col md={12}>
                <Form.Label>Adres</Form.Label>
                <Form.Control value={editing.address} onChange={set('address')} />
              </Col>
              <Col md={12}>
                <Form.Label>Not</Form.Label>
                <Form.Control value={editing.note} onChange={set('note')} placeholder="Ödeme vadesi, teslim günü vb." />
              </Col>
            </Row>
          </Modal.Body>
        )}
        <Modal.Footer className="justify-content-between">
          <div>
            {editing?.id && (
              <Button variant="outline-danger" onClick={() => setConfirmDelete(true)}>
                Kaldır
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

      <Modal show={confirmDelete} onHide={() => setConfirmDelete(false)} centered size="sm">
        <Modal.Body className="text-center">
          <p className="mb-0">
            <strong>{editing?.name}</strong> listeden kaldırılsın mı? Geçmiş stok girişleri korunur.
          </p>
        </Modal.Body>
        <Modal.Footer className="justify-content-center">
          <Button variant="light" onClick={() => setConfirmDelete(false)}>
            Vazgeç
          </Button>
          <Button variant="danger" onClick={remove}>
            Kaldır
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default TedarikcilerPage
