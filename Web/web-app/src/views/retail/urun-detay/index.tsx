import PageMetaData from '@/components/PageMetaData'
import Icon from '@/components/wrappers/Icon'
import { ProductThumb, RetailHeader, StatCard, StockBadge, StoreSwitcher } from '@/components/retail'
import { useStore } from '@/context/StoreContext'
import { useNotificationContext } from '@/context/useNotificationContext'
import { fmt, fmtDateTime, fmtQty, MOVEMENT_LABELS, parseAmount, stockVariant, toInput } from '@/lib/format'
import { errorMessage, retailApi, type Product, type ProductBranch, type ProductDetail } from '@/lib/retail'
import { useCallback, useEffect, useState } from 'react'
import { Badge, Button, ButtonGroup, Card, CardBody, CardHeader, Col, Form, Modal, Nav, Row, Spinner, Table } from 'react-bootstrap'
import { Link, useParams } from 'react-router'

const UrunDetayPage = () => {
  const { productId = '' } = useParams()
  const { storeId, stores, canManage, selectStore } = useStore()
  const { showNotification } = useNotificationContext()

  const [data, setData] = useState<ProductDetail | null>(null)
  const [branches, setBranches] = useState<ProductBranch[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'prices' | 'stock'>('prices')
  const [editOpen, setEditOpen] = useState(false)
  const [adjustOpen, setAdjustOpen] = useState(false)
  const multiStore = stores.length > 1

  const load = useCallback(async () => {
    if (!storeId) return
    try {
      const [detail, perStore] = await Promise.all([
        retailApi.productDetail(storeId, productId),
        multiStore ? retailApi.productBranches(productId) : Promise.resolve(null),
      ])
      setData(detail)
      setBranches(perStore)
    } catch (e) {
      showNotification({ message: errorMessage(e, 'Ürün yüklenemedi.'), variant: 'danger' })
    } finally {
      setLoading(false)
    }
  }, [storeId, productId, multiStore])

  useEffect(() => {
    load()
  }, [load])

  if (loading || !data)
    return (
      <>
        <RetailHeader title="Ürün Detayı" />
        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" />
          </div>
        )}
      </>
    )

  const p = data.product
  const margin = p.salePrice && p.purchasePrice ? ((p.salePrice - p.purchasePrice) / p.salePrice) * 100 : null

  return (
    <>
      <PageMetaData title={p.name} />
      <RetailHeader
        title="Ürün Detayı"
        subtitle={
          <Link to="/urunler" className="text-muted">
            <Icon icon="arrow-left" className="me-1" />
            Ürünlere dön
          </Link>
        }
        actions={
          <>
            {canManage && (
              <>
                <Button variant="outline-primary" size="sm" onClick={() => setAdjustOpen(true)}>
                  <Icon icon="adjustments" className="me-1" /> Stok Düzelt
                </Button>
                <Button size="sm" onClick={() => setEditOpen(true)}>
                  <Icon icon="edit" className="me-1" /> Fiyat & Ayarlar
                </Button>
              </>
            )}
            <StoreSwitcher />
          </>
        }
      />

      <Card>
        <CardBody className="d-flex align-items-center gap-3">
          <ProductThumb uri={p.imageUrl} size={96} />
          <div>
            <h4 className="mb-1">{p.name}</h4>
            {p.brand && <div className="text-muted">{p.brand}</div>}
            <div className="text-muted fs-sm mt-1">
              <Icon icon="barcode" className="me-1" />
              {p.barcode}
              {p.category || p.quantity ? ` · ${[p.category, p.quantity].filter(Boolean).join(' · ')}` : ''}
            </div>
          </div>
        </CardBody>
      </Card>

      <Row className="g-3 mb-3">
        <Col sm={6} xl={3}>
          <StatCard label="Satış fiyatı" value={p.salePrice != null ? fmt(p.salePrice) : '—'} icon="tag" />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard label="Alış fiyatı" value={p.purchasePrice != null ? fmt(p.purchasePrice) : '—'} icon="truck" variant="info" />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard label="Stok" value={fmtQty(p.stockQuantity)} icon="packages" variant={stockVariant(p)} hint={p.minStockLevel != null ? `Min. stok ${fmtQty(p.minStockLevel)}` : undefined} />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            label="Kâr marjı"
            value={margin != null ? `%${margin.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}` : '—'}
            icon="percentage"
            variant={margin == null ? 'secondary' : margin >= 0 ? 'success' : 'danger'}
            hint={`KDV %${fmtQty(p.vatRate)}`}
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard label={`Son ${data.sales.days} gün satış`} value={`${fmtQty(data.sales.quantity)} adet`} icon="shopping-cart" variant="purple" />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard label={`Son ${data.sales.days} gün ciro`} value={fmt(data.sales.revenue)} icon="chart-line" variant="success" />
        </Col>
      </Row>

      <Row className="g-3">
        {branches && (
          <Col xl={5}>
            <Card className="mb-0 h-100">
              <CardHeader className="d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Şubelere göre</h5>
                <span className="text-muted fs-sm">Toplam stok {fmtQty(branches.reduce((s, b) => s + b.stockQuantity, 0))}</span>
              </CardHeader>
              <Table hover className="align-middle mb-0">
                <tbody>
                  {branches.map((b) => {
                    const current = b.storeId === storeId
                    return (
                      <tr key={b.storeId} role={current ? undefined : 'button'} onClick={() => !current && selectStore(b.storeId)}>
                        <td>
                          <Icon icon="building-store" className={current ? 'text-primary me-2' : 'text-muted me-2'} />
                          <span className={current ? 'fw-semibold' : ''}>{b.storeName}</span>
                          {current && (
                            <Badge bg="primary-subtle" className="text-primary ms-2">
                              aktif
                            </Badge>
                          )}
                        </td>
                        <td className="text-end">{b.salePrice != null ? fmt(b.salePrice) : '—'}</td>
                        <td className="text-end" style={{ width: 90 }}>
                          <StockBadge variant={stockVariant(b)}>{fmtQty(b.stockQuantity)}</StockBadge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
              <CardBody className="text-muted fs-xs pt-2">Bir şubeye tıklayarak o şubenin fiyat ve stoğunu yönetebilirsiniz.</CardBody>
            </Card>
          </Col>
        )}

        <Col xl={branches ? 7 : 12}>
          <Card className="mb-0 h-100">
            <CardHeader>
              <Nav variant="pills" activeKey={tab} onSelect={(k) => setTab(k as 'prices' | 'stock')}>
                <Nav.Item>
                  <Nav.Link eventKey="prices">
                    <Icon icon="history" className="me-1" /> Fiyat geçmişi
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="stock">
                    <Icon icon="arrows-exchange" className="me-1" /> Stok hareketleri
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </CardHeader>
            {tab === 'prices' ? (
              data.priceHistory.length === 0 ? (
                <CardBody className="text-center text-muted">Henüz fiyat değişikliği yok.</CardBody>
              ) : (
                <Table responsive className="align-middle mb-0">
                  <thead className="bg-light-subtle">
                    <tr className="text-uppercase fs-xxs">
                      <th>Tür</th>
                      <th>Eski</th>
                      <th>Yeni</th>
                      <th>Tarih</th>
                      <th>Not</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.priceHistory.map((h, i) => (
                      <tr key={i}>
                        <td>
                          <Badge bg={h.type === 1 ? 'primary-subtle' : 'warning-subtle'} className={h.type === 1 ? 'text-primary' : 'text-warning'}>
                            {h.type === 1 ? 'SATIŞ' : 'ALIŞ'}
                          </Badge>
                        </td>
                        <td className="text-muted">{h.oldPrice != null ? fmt(h.oldPrice) : '—'}</td>
                        <td className="fw-semibold">
                          {fmt(h.newPrice)}
                          {h.oldPrice != null && h.newPrice !== h.oldPrice && (
                            <Icon icon={h.newPrice > h.oldPrice ? 'arrow-up' : 'arrow-down'} className={`ms-1 ${h.newPrice > h.oldPrice ? 'text-danger' : 'text-success'}`} />
                          )}
                        </td>
                        <td className="text-muted">{fmtDateTime(h.changedAt)}</td>
                        <td className="text-muted">{h.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )
            ) : data.stockMovements.length === 0 ? (
              <CardBody className="text-center text-muted">Henüz stok hareketi yok.</CardBody>
            ) : (
              <Table responsive className="align-middle mb-0">
                <thead className="bg-light-subtle">
                  <tr className="text-uppercase fs-xxs">
                    <th>Hareket</th>
                    <th className="text-end">Miktar</th>
                    <th className="text-end">Kalan</th>
                    <th className="text-end">Birim fiyat</th>
                    <th>Tarih</th>
                    <th>Not</th>
                  </tr>
                </thead>
                <tbody>
                  {data.stockMovements.map((m, i) => (
                    <tr key={i}>
                      <td>{MOVEMENT_LABELS[m.type] ?? 'Hareket'}</td>
                      <td className={`text-end fw-semibold ${m.quantity >= 0 ? 'text-success' : 'text-danger'}`}>
                        {m.quantity >= 0 ? '+' : ''}
                        {fmtQty(m.quantity)}
                      </td>
                      <td className="text-end">{fmtQty(m.balanceAfter)}</td>
                      <td className="text-end text-muted">{m.unitPrice != null ? fmt(m.unitPrice) : '—'}</td>
                      <td className="text-muted">{fmtDateTime(m.createdAt)}</td>
                      <td className="text-muted">{m.note}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </Col>
      </Row>

      <EditModal show={editOpen} product={p} onClose={() => setEditOpen(false)} onSaved={() => { setEditOpen(false); load() }} />
      <AdjustModal show={adjustOpen} product={p} onClose={() => setAdjustOpen(false)} onSaved={() => { setAdjustOpen(false); load() }} />
    </>
  )
}

const EditModal = ({ show, product, onClose, onSaved }: { show: boolean; product: Product; onClose: () => void; onSaved: () => void }) => {
  const { storeId } = useStore()
  const { showNotification } = useNotificationContext()
  const [form, setForm] = useState({ salePrice: '', purchasePrice: '', vatRate: '', minStockLevel: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!show) return
    setForm({
      salePrice: toInput(product.salePrice),
      purchasePrice: toInput(product.purchasePrice),
      vatRate: String(product.vatRate ?? 20),
      minStockLevel: product.minStockLevel != null ? String(product.minStockLevel) : '',
    })
  }, [show, product])

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const save = async () => {
    if (!storeId) return
    const body = {
      salePrice: parseAmount(form.salePrice),
      purchasePrice: parseAmount(form.purchasePrice),
      vatRate: parseAmount(form.vatRate) ?? undefined,
      minStockLevel: parseAmount(form.minStockLevel),
    }
    if (form.salePrice && body.salePrice == null) return showNotification({ message: 'Satış fiyatı geçersiz.', variant: 'danger' })
    if (form.purchasePrice && body.purchasePrice == null) return showNotification({ message: 'Alış fiyatı geçersiz.', variant: 'danger' })
    setSaving(true)
    try {
      await retailApi.updateProduct(storeId, product.productId, body)
      showNotification({ message: 'Ürün güncellendi.', variant: 'success' })
      onSaved()
    } catch (e) {
      showNotification({ message: errorMessage(e, 'Kaydedilemedi.'), variant: 'danger' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Fiyat & Ayarlar</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row className="g-3">
          <Col sm={6}>
            <Form.Label>Satış fiyatı (₺)</Form.Label>
            <Form.Control value={form.salePrice} onChange={set('salePrice')} placeholder="0,00" inputMode="decimal" />
          </Col>
          <Col sm={6}>
            <Form.Label>Alış fiyatı (₺)</Form.Label>
            <Form.Control value={form.purchasePrice} onChange={set('purchasePrice')} placeholder="0,00" inputMode="decimal" />
          </Col>
          <Col sm={6}>
            <Form.Label>KDV oranı (%)</Form.Label>
            <Form.Select value={form.vatRate} onChange={set('vatRate')}>
              {['0', '1', '10', '20'].map((v) => (
                <option key={v} value={v}>
                  %{v}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col sm={6}>
            <Form.Label>Minimum stok</Form.Label>
            <Form.Control value={form.minStockLevel} onChange={set('minStockLevel')} placeholder="Uyarı seviyesi" inputMode="decimal" />
          </Col>
        </Row>
        <Form.Text>Fiyat değişiklikleri fiyat geçmişine kaydedilir.</Form.Text>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={onClose}>
          Vazgeç
        </Button>
        <Button disabled={saving} onClick={save}>
          {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

const ADJUST_TYPES = [
  { type: 4, label: 'Sayım', icon: 'clipboard-check', hint: 'Raftaki gerçek miktarı girin; fark stok hareketi olarak kaydedilir.' },
  { type: 5, label: 'Fire', icon: 'trash', hint: 'Bozulan, kırılan veya kaybolan miktar stoktan düşülür.' },
  { type: 3, label: 'İade', icon: 'arrow-back-up', hint: 'Müşteriden geri alınan miktar stoğa eklenir.' },
]

const AdjustModal = ({ show, product, onClose, onSaved }: { show: boolean; product: Product; onClose: () => void; onSaved: () => void }) => {
  const { storeId } = useStore()
  const { showNotification } = useNotificationContext()
  const [type, setType] = useState(4)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (show) {
      setType(4)
      setAmount('')
      setNote('')
    }
  }, [show])

  const selected = ADJUST_TYPES.find((t) => t.type === type)!
  const value = parseAmount(amount)
  const preview = value == null ? null : type === 4 ? value : type === 5 ? product.stockQuantity - value : product.stockQuantity + value

  const save = async () => {
    if (!storeId) return
    if (value == null || value < 0 || (type !== 4 && value === 0)) return showNotification({ message: 'Geçerli bir miktar girin.', variant: 'danger' })
    setSaving(true)
    try {
      await retailApi.adjustStock(
        storeId,
        product.productId,
        type === 4 ? { type, countedQuantity: value, note: note.trim() || undefined } : { type, quantity: value, note: note.trim() || undefined },
      )
      showNotification({ message: 'Stok güncellendi.', variant: 'success' })
      onSaved()
    } catch (e) {
      showNotification({ message: errorMessage(e, 'Kaydedilemedi.'), variant: 'danger' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Stok Düzelt</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ButtonGroup className="w-100 mb-2">
          {ADJUST_TYPES.map((t) => (
            <Button key={t.type} variant={type === t.type ? 'primary' : 'light'} onClick={() => setType(t.type)}>
              <Icon icon={t.icon} className="me-1" /> {t.label}
            </Button>
          ))}
        </ButtonGroup>
        <p className="text-muted fs-sm">{selected.hint}</p>
        <Form.Group className="mb-2">
          <Form.Label>{type === 4 ? 'Sayılan miktar' : 'Miktar'}</Form.Label>
          <Form.Control autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" inputMode="decimal" />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Not (isteğe bağlı)</Form.Label>
          <Form.Control value={note} onChange={(e) => setNote(e.target.value)} placeholder="Örn. Ay sonu sayımı" />
        </Form.Group>
        <div className="d-flex justify-content-between bg-light rounded p-2">
          <span className="text-muted">Mevcut stok: {fmtQty(product.stockQuantity)}</span>
          {preview != null && <strong>Yeni stok: {fmtQty(preview)}</strong>}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={onClose}>
          Vazgeç
        </Button>
        <Button disabled={saving} onClick={save}>
          {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default UrunDetayPage
