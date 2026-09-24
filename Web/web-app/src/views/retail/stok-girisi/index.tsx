import PageMetaData from '@/components/PageMetaData'
import Icon from '@/components/wrappers/Icon'
import { EmptyState, NoPermission, ProductThumb, RetailHeader, StoreSwitcher } from '@/components/retail'
import BarcodeInput from '@/components/retail/BarcodeInput'
import { useStore } from '@/context/StoreContext'
import { useNotificationContext } from '@/context/useNotificationContext'
import { fmt, fmtQty, parseAmount, toInput } from '@/lib/format'
import { errorMessage, isNotFound, retailApi, type Product, type Supplier } from '@/lib/retail'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Card, CardBody, CardHeader, Col, Form, Modal, Row, Table } from 'react-bootstrap'
import { Link } from 'react-router'

type Line = {
  productId: string
  name: string
  barcode: string
  imageUrl?: string
  currentStock: number
  quantity: string
  unitCost: string
  salePrice: string
  originalSalePrice?: number | null
}

const toLine = (p: Product): Line => ({
  productId: p.productId,
  name: p.name,
  barcode: p.barcode,
  imageUrl: p.imageUrl,
  currentStock: p.stockQuantity,
  quantity: '1',
  unitCost: toInput(p.purchasePrice),
  salePrice: toInput(p.salePrice),
  originalSalePrice: p.salePrice,
})

const StokGirisiPage = () => {
  const { storeId, canManage } = useStore()
  const { showNotification } = useNotificationContext()
  const barcodeRef = useRef<HTMLInputElement>(null)

  const [lines, setLines] = useState<Line[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supplierId, setSupplierId] = useState('')
  const [documentNo, setDocumentNo] = useState('')
  const [looking, setLooking] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newBarcode, setNewBarcode] = useState<string | null>(null)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    setLines([])
    setSupplierId('')
    setDocumentNo('')
    if (storeId) retailApi.suppliers(storeId).then(setSuppliers).catch(() => setSuppliers([]))
  }, [storeId])

  const total = useMemo(() => lines.reduce((s, l) => s + (parseAmount(l.quantity) ?? 0) * (parseAmount(l.unitCost) ?? 0), 0), [lines])

  const addProduct = (p: Product) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === p.productId)
      if (existing) return prev.map((l) => (l.productId === p.productId ? { ...l, quantity: String((parseAmount(l.quantity) ?? 0) + 1).replace('.', ',') } : l))
      return [toLine(p), ...prev]
    })
    window.setTimeout(() => barcodeRef.current?.focus(), 50)
  }

  const handleBarcode = async (barcode: string) => {
    if (!storeId) return
    setLooking(true)
    try {
      addProduct(await retailApi.byBarcode(storeId, barcode))
    } catch (e) {
      if (isNotFound(e)) {
        setNewName('')
        setNewBarcode(barcode)
      } else showNotification({ message: errorMessage(e), variant: 'danger' })
    } finally {
      setLooking(false)
    }
  }

  const createProduct = async () => {
    if (!storeId || !newBarcode || newName.trim().length < 2) return
    try {
      addProduct(await retailApi.createProduct(storeId, { barcode: newBarcode, name: newName.trim() }))
      setNewBarcode(null)
    } catch (e) {
      showNotification({ message: errorMessage(e, 'Ürün eklenemedi.'), variant: 'danger' })
    }
  }

  const update = (productId: string, key: keyof Line, value: string) => setLines((prev) => prev.map((l) => (l.productId === productId ? { ...l, [key]: value } : l)))

  const save = async () => {
    if (!storeId) return
    const items = []
    for (const l of lines) {
      const quantity = parseAmount(l.quantity)
      const unitCost = parseAmount(l.unitCost)
      const salePrice = l.salePrice ? parseAmount(l.salePrice) : null
      if (!quantity || quantity <= 0) return showNotification({ message: `${l.name}: miktar girin.`, variant: 'warning' })
      if (unitCost == null) return showNotification({ message: `${l.name}: alış fiyatı girin.`, variant: 'warning' })
      if (l.salePrice && salePrice == null) return showNotification({ message: `${l.name}: satış fiyatı geçersiz.`, variant: 'warning' })
      items.push({ productId: l.productId, quantity, unitCost, salePrice: salePrice === l.originalSalePrice ? null : salePrice })
    }
    setSaving(true)
    try {
      const purchase = await retailApi.createPurchase(storeId, { supplierId: supplierId || null, documentNo: documentNo.trim() || null, items })
      setLines([])
      setDocumentNo('')
      setSupplierId('')
      showNotification({ title: 'Stok girişi kaydedildi', message: `${purchase.itemCount} kalem · ${fmt(purchase.totalAmount)}`, variant: 'success' })
    } catch (e) {
      showNotification({ message: errorMessage(e, 'Kaydedilemedi.'), variant: 'danger' })
    } finally {
      setSaving(false)
    }
  }

  const header = (
    <RetailHeader
      title="Stok Girişi"
      subtitle="Tedarikçiden gelen ürünleri stoğa ekleyin"
      actions={
        <>
          <Link to="/stok-girisleri" className="btn btn-sm btn-outline-primary">
            <Icon icon="history" className="me-1" /> Geçmiş
          </Link>
          <StoreSwitcher />
        </>
      }
    />
  )

  if (!canManage)
    return (
      <>
        {header}
        <Card>
          <NoPermission what="Stok girişini" />
        </Card>
      </>
    )

  return (
    <>
      <PageMetaData title="Stok Girişi" />
      {header}

      <Card>
        <CardHeader className="border-light">
          <Row className="g-2">
            <Col md={4}>
              <Form.Label className="fs-sm text-muted mb-1">Tedarikçi</Form.Label>
              <Form.Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                <option value="">Tedarikçisiz</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Form.Select>
              <Link to="/tedarikciler" className="fs-xs">
                Tedarikçileri yönet
              </Link>
            </Col>
            <Col md={3}>
              <Form.Label className="fs-sm text-muted mb-1">İrsaliye / fatura no</Form.Label>
              <Form.Control value={documentNo} onChange={(e) => setDocumentNo(e.target.value)} />
            </Col>
            <Col md={5}>
              <Form.Label className="fs-sm text-muted mb-1">Ürün ekle</Form.Label>
              <BarcodeInput ref={barcodeRef} onBarcode={handleBarcode} onPickProduct={addProduct} busy={looking} />
            </Col>
          </Row>
        </CardHeader>
        <CardBody className="p-0">
          {lines.length === 0 ? (
            <EmptyState
              icon="truck-delivery"
              title="Gelen ürünleri ekleyin"
              message="Barkodları okutun, miktar ve alış fiyatını girin. Kaydettiğinizde stok artar ve fiyat geçmişi güncellenir."
            />
          ) : (
            <Table responsive className="align-middle mb-0">
              <thead className="bg-light-subtle">
                <tr className="text-uppercase fs-xxs">
                  <th>Ürün</th>
                  <th className="text-end">Mevcut stok</th>
                  <th style={{ width: 110 }}>Miktar</th>
                  <th style={{ width: 130 }}>Alış ₺</th>
                  <th style={{ width: 130 }}>Satış ₺</th>
                  <th className="text-end">Tutar</th>
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.productId}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <ProductThumb uri={l.imageUrl} size={40} />
                        <div className="overflow-hidden">
                          <div className="fw-semibold text-truncate" style={{ maxWidth: 300 }}>
                            {l.name}
                          </div>
                          <div className="text-muted fs-xs">{l.barcode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-end text-muted">{fmtQty(l.currentStock)}</td>
                    <td>
                      <Form.Control size="sm" value={l.quantity} onChange={(e) => update(l.productId, 'quantity', e.target.value)} inputMode="decimal" />
                    </td>
                    <td>
                      <Form.Control size="sm" value={l.unitCost} onChange={(e) => update(l.productId, 'unitCost', e.target.value)} placeholder="0,00" inputMode="decimal" />
                    </td>
                    <td>
                      <Form.Control size="sm" value={l.salePrice} onChange={(e) => update(l.productId, 'salePrice', e.target.value)} placeholder="0,00" inputMode="decimal" />
                    </td>
                    <td className="text-end fw-semibold">{fmt((parseAmount(l.quantity) ?? 0) * (parseAmount(l.unitCost) ?? 0))}</td>
                    <td>
                      <Button size="sm" variant="link" className="text-danger p-0" onClick={() => setLines((prev) => prev.filter((x) => x.productId !== l.productId))}>
                        <Icon icon="trash" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
        {lines.length > 0 && (
          <CardBody className="border-top d-flex flex-wrap justify-content-end align-items-center gap-3">
            <span className="text-muted">{lines.length} kalem</span>
            <span className="fs-3 fw-bold">{fmt(total)}</span>
            <Button size="lg" disabled={saving} onClick={save}>
              {saving ? 'Kaydediliyor…' : 'Stok Girişini Kaydet'}
            </Button>
          </CardBody>
        )}
      </Card>

      <Modal show={!!newBarcode} onHide={() => setNewBarcode(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Katalogda yok</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted">
            <strong>{newBarcode}</strong> barkodu katalogda bulunamadı.
          </p>
          <Form.Label>Ürün adı</Form.Label>
          <Form.Control autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && createProduct()} placeholder="Örn. Eti Burçak 131 g" />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setNewBarcode(null)}>
            Vazgeç
          </Button>
          <Button disabled={newName.trim().length < 2} onClick={createProduct}>
            Ürünü Oluştur ve Ekle
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default StokGirisiPage
