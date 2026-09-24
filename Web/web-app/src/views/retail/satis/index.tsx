import PageMetaData from '@/components/PageMetaData'
import Icon from '@/components/wrappers/Icon'
import { ProductThumb, RetailHeader, StoreSwitcher, EmptyState } from '@/components/retail'
import BarcodeInput from '@/components/retail/BarcodeInput'
import { useStore } from '@/context/StoreContext'
import { useNotificationContext } from '@/context/useNotificationContext'
import { fmt, fmtQty, parseAmount, PAYMENT_LABELS, toInput } from '@/lib/format'
import { errorMessage, isNotFound, retailApi, type Product, type Sale } from '@/lib/retail'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, ButtonGroup, Card, CardBody, CardHeader, Col, Form, Modal, Row, Table } from 'react-bootstrap'

type CartLine = Product & { unitPrice: number; qty: number }

const SatisPage = () => {
  const { store, storeId } = useStore()
  const { showNotification } = useNotificationContext()
  const barcodeRef = useRef<HTMLInputElement>(null)

  const [cart, setCart] = useState<CartLine[]>([])
  const [payment, setPayment] = useState<0 | 1>(0)
  const [looking, setLooking] = useState(false)
  const [saving, setSaving] = useState(false)
  const [priceFor, setPriceFor] = useState<Product | null>(null) // fiyatı olmayan ürün
  const [newBarcode, setNewBarcode] = useState<string | null>(null) // katalogda olmayan barkod
  const [lastSale, setLastSale] = useState<Sale | null>(null)

  // Şube değişince sepet o şubenin fiyat/stoğuna ait olmadığı için temizlenir
  useEffect(() => {
    setCart([])
    setLastSale(null)
  }, [storeId])

  const focusBarcode = () => window.setTimeout(() => barcodeRef.current?.focus(), 50)

  const total = useMemo(() => cart.reduce((s, l) => s + l.unitPrice * l.qty, 0), [cart])
  const vat = useMemo(() => cart.reduce((s, l) => s + (l.unitPrice * l.qty * l.vatRate) / (100 + l.vatRate), 0), [cart])
  const itemCount = useMemo(() => cart.reduce((s, l) => s + l.qty, 0), [cart])

  const addLine = (product: Product, unitPrice: number, qty = 1) => {
    setLastSale(null)
    setCart((lines) => {
      const existing = lines.find((l) => l.productId === product.productId)
      if (existing) return lines.map((l) => (l.productId === product.productId ? { ...l, unitPrice, qty: l.qty + qty } : l))
      return [{ ...product, unitPrice, qty }, ...lines]
    })
    focusBarcode()
  }

  const addProduct = (product: Product) => {
    const existing = cart.find((l) => l.productId === product.productId)
    const price = existing?.unitPrice ?? product.salePrice
    if (price == null) setPriceFor(product)
    else addLine(product, price)
  }

  const handleBarcode = async (barcode: string) => {
    if (!storeId) return
    setLooking(true)
    try {
      addProduct(await retailApi.byBarcode(storeId, barcode))
    } catch (e) {
      if (isNotFound(e)) setNewBarcode(barcode)
      else showNotification({ message: errorMessage(e, 'Ürün sorgulanamadı.'), variant: 'danger' })
    } finally {
      setLooking(false)
    }
  }

  const updateLine = (productId: string, patch: Partial<CartLine>) =>
    setCart((lines) => lines.map((l) => (l.productId === productId ? { ...l, ...patch } : l)).filter((l) => l.qty > 0))

  const completeSale = async () => {
    if (!storeId || cart.length === 0) return
    setSaving(true)
    try {
      const sale = await retailApi.createSale(storeId, {
        paymentMethod: payment,
        items: cart.map((l) => ({ productId: l.productId, quantity: l.qty, unitPrice: l.unitPrice })),
      })
      setCart([])
      setPayment(0)
      setLastSale(sale)
      showNotification({ title: 'Satış tamamlandı', message: `${sale.items.length} kalem · ${fmt(sale.totalAmount)}`, variant: 'success' })
    } catch (e) {
      showNotification({ message: errorMessage(e, 'Satış kaydedilemedi.'), variant: 'danger' })
    } finally {
      setSaving(false)
      focusBarcode()
    }
  }

  return (
    <>
      <PageMetaData title="Satış" />
      <RetailHeader title="Satış" subtitle={store?.name} actions={<StoreSwitcher />} />

      <Row className="g-3">
        <Col xl={8}>
          <Card className="mb-0">
            <CardHeader className="border-bottom-0 pb-0">
              <BarcodeInput ref={barcodeRef} onBarcode={handleBarcode} onPickProduct={addProduct} busy={looking} />
            </CardHeader>
            <CardBody>
              {cart.length === 0 ? (
                lastSale ? (
                  <EmptyState
                    icon="circle-check"
                    title={`Son satış: ${fmt(lastSale.totalAmount)}`}
                    message={`${lastSale.items.length} kalem · ${PAYMENT_LABELS[lastSale.paymentMethod]} · KDV ${fmt(lastSale.vatAmount)}. Yeni satış için barkod okutun.`}
                  />
                ) : (
                  <EmptyState icon="barcode" title="Sepet boş" message="Ürün eklemek için barkodu okutun veya ürün arayın." />
                )
              ) : (
                <Table responsive className="align-middle mb-0">
                  <thead className="bg-light-subtle">
                    <tr className="text-uppercase fs-xxs">
                      <th>Ürün</th>
                      <th style={{ width: 140 }}>Birim fiyat</th>
                      <th style={{ width: 150 }} className="text-center">
                        Adet
                      </th>
                      <th className="text-end">Tutar</th>
                      <th style={{ width: 40 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((l) => (
                      <tr key={l.productId}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <ProductThumb uri={l.imageUrl} size={40} />
                            <div className="overflow-hidden">
                              <div className="fw-semibold text-truncate" style={{ maxWidth: 320 }}>
                                {l.name}
                              </div>
                              <div className="text-muted fs-xs">{l.barcode}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <PriceCell value={l.unitPrice} onChange={(v) => updateLine(l.productId, { unitPrice: v })} />
                        </td>
                        <td>
                          <div className="d-flex align-items-center justify-content-center gap-1">
                            <Button size="sm" variant="light" className="btn-icon" onClick={() => updateLine(l.productId, { qty: l.qty - 1 })}>
                              <Icon icon={l.qty === 1 ? 'trash' : 'minus'} className={l.qty === 1 ? 'text-danger' : ''} />
                            </Button>
                            <Form.Control
                              size="sm"
                              className="text-center"
                              style={{ width: 56 }}
                              value={l.qty}
                              onChange={(e) => {
                                const q = Number(e.target.value.replace(',', '.'))
                                if (Number.isFinite(q) && q >= 0) updateLine(l.productId, { qty: q })
                              }}
                            />
                            <Button size="sm" variant="light" className="btn-icon" onClick={() => updateLine(l.productId, { qty: l.qty + 1 })}>
                              <Icon icon="plus" />
                            </Button>
                          </div>
                        </td>
                        <td className="text-end fw-semibold">{fmt(l.unitPrice * l.qty)}</td>
                        <td>
                          <Button size="sm" variant="link" className="text-danger p-0" onClick={() => updateLine(l.productId, { qty: 0 })} title="Kaldır">
                            <Icon icon="x" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>
        </Col>

        <Col xl={4}>
          <Card className="mb-0 position-sticky" style={{ top: 90 }}>
            <CardBody>
              <div className="d-flex justify-content-between text-muted">
                <span>{fmtQty(itemCount)} ürün</span>
                <span>KDV (dahil) {fmt(vat)}</span>
              </div>
              <div className="d-flex justify-content-between align-items-end my-3">
                <span className="fs-lg fw-semibold">Toplam</span>
                <span className="display-6 fw-bold">{fmt(total)}</span>
              </div>
              <ButtonGroup className="w-100 mb-3">
                <Button variant={payment === 0 ? 'primary' : 'outline-primary'} onClick={() => setPayment(0)}>
                  <Icon icon="cash" className="me-1" /> Nakit
                </Button>
                <Button variant={payment === 1 ? 'primary' : 'outline-primary'} onClick={() => setPayment(1)}>
                  <Icon icon="credit-card" className="me-1" /> Kart
                </Button>
              </ButtonGroup>
              <Button size="lg" className="w-100" disabled={cart.length === 0 || saving} onClick={completeSale}>
                {saving ? 'Kaydediliyor…' : 'Satışı Onayla'}
              </Button>
              {cart.length > 0 && (
                <Button variant="link" className="w-100 text-danger mt-2" onClick={() => setCart([])}>
                  Sepeti temizle
                </Button>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      <PriceModal
        product={priceFor}
        onClose={() => {
          setPriceFor(null)
          focusBarcode()
        }}
        onSubmit={(price) => {
          if (priceFor) addLine(priceFor, price)
          setPriceFor(null)
        }}
      />
      <NewProductModal
        barcode={newBarcode}
        onClose={() => {
          setNewBarcode(null)
          focusBarcode()
        }}
        onCreated={(p, price) => {
          setNewBarcode(null)
          addLine(p, price)
        }}
      />
    </>
  )
}

// Satırdaki birim fiyat: odaktan çıkınca/Enter'da uygulanır
const PriceCell = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
  const [text, setText] = useState(toInput(value))
  useEffect(() => setText(toInput(value)), [value])
  const apply = () => {
    const v = parseAmount(text)
    if (v != null && v >= 0) onChange(v)
    else setText(toInput(value))
  }
  return (
    <Form.Control
      size="sm"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={apply}
      onKeyDown={(e) => e.key === 'Enter' && apply()}
      inputMode="decimal"
    />
  )
}

const PriceModal = ({ product, onClose, onSubmit }: { product: Product | null; onClose: () => void; onSubmit: (price: number) => void }) => {
  const [text, setText] = useState('')
  useEffect(() => setText(''), [product])
  const price = parseAmount(text)
  return (
    <Modal show={!!product} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Satış fiyatı girin</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {product && (
          <div className="d-flex align-items-center gap-3 mb-3">
            <ProductThumb uri={product.imageUrl} size={64} />
            <div>
              <div className="fw-semibold">{product.name}</div>
              <div className="text-muted fs-sm">{[product.brand, product.barcode, product.quantity].filter(Boolean).join(' · ')}</div>
            </div>
          </div>
        )}
        <Form.Label>Satış fiyatı (₺)</Form.Label>
        <Form.Control
          autoFocus
          size="lg"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && price && price > 0 && onSubmit(price)}
          placeholder="0,00"
          inputMode="decimal"
        />
        <Form.Text>Bu ürün için henüz fiyat girilmemiş; girdiğiniz fiyat satışla birlikte mağazanıza kaydedilir.</Form.Text>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={onClose}>
          Vazgeç
        </Button>
        <Button disabled={!price || price <= 0} onClick={() => price && onSubmit(price)}>
          Sepete Ekle
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

const NewProductModal = ({ barcode, onClose, onCreated }: { barcode: string | null; onClose: () => void; onCreated: (p: Product, price: number) => void }) => {
  const { storeId } = useStore()
  const { showNotification } = useNotificationContext()
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [priceText, setPriceText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setName('')
    setBrand('')
    setPriceText('')
  }, [barcode])

  const price = parseAmount(priceText)
  const valid = name.trim().length > 1 && price != null && price > 0

  const save = async () => {
    if (!storeId || !barcode || !valid) return
    setSaving(true)
    try {
      const p = await retailApi.createProduct(storeId, { barcode, name: name.trim(), brand: brand.trim() || undefined, salePrice: price })
      onCreated(p, price!)
    } catch (e) {
      showNotification({ message: errorMessage(e, 'Ürün eklenemedi.'), variant: 'danger' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal show={!!barcode} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Katalogda yok</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted">
          <strong>{barcode}</strong> barkodu katalogda bulunamadı. Ürünü mağazanıza ekleyip satışa devam edebilirsiniz.
        </p>
        <Form.Group className="mb-2">
          <Form.Label>Ürün adı *</Form.Label>
          <Form.Control autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn. Ülker Çikolatalı Gofret 36 g" />
        </Form.Group>
        <Row>
          <Col>
            <Form.Group className="mb-2">
              <Form.Label>Marka</Form.Label>
              <Form.Control value={brand} onChange={(e) => setBrand(e.target.value)} />
            </Form.Group>
          </Col>
          <Col>
            <Form.Group className="mb-2">
              <Form.Label>Satış fiyatı (₺) *</Form.Label>
              <Form.Control value={priceText} onChange={(e) => setPriceText(e.target.value)} placeholder="0,00" inputMode="decimal" />
            </Form.Group>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={onClose}>
          Vazgeç
        </Button>
        <Button disabled={!valid || saving} onClick={save}>
          {saving ? 'Kaydediliyor…' : 'Kaydet ve Ekle'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default SatisPage
