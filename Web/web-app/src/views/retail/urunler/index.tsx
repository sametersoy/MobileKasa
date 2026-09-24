import PageMetaData from '@/components/PageMetaData'
import Icon from '@/components/wrappers/Icon'
import { EmptyState, ProductThumb, RetailHeader, StockBadge, StoreSwitcher } from '@/components/retail'
import BarcodeInput from '@/components/retail/BarcodeInput'
import { useStore } from '@/context/StoreContext'
import { useNotificationContext } from '@/context/useNotificationContext'
import { fmt, fmtQty, stockVariant } from '@/lib/format'
import { errorMessage, isNotFound, retailApi, type AllStoresProduct, type Product } from '@/lib/retail'
import { useEffect, useRef, useState } from 'react'
import { Button, ButtonGroup, Card, CardBody, CardHeader, Col, Form, InputGroup, Modal, Pagination, Row, Spinner, Table } from 'react-bootstrap'
import { useNavigate } from 'react-router'

const PAGE_SIZE = 25

type ProductRow = Product | AllStoresProduct

// Tek şubede satış fiyatı; tüm şubeler görünümünde şubeler arası fiyat aralığı
const priceText = (p: ProductRow) => {
  if ('minSalePrice' in p) {
    if (p.minSalePrice == null) return '—'
    return p.minSalePrice === p.maxSalePrice ? fmt(p.minSalePrice) : `${fmt(p.minSalePrice)} – ${fmt(p.maxSalePrice)}`
  }
  return p.salePrice != null ? fmt(p.salePrice) : '—'
}

const UrunlerPage = () => {
  const navigate = useNavigate()
  const { storeId, stores } = useStore()
  const { showNotification } = useNotificationContext()

  const [query, setQuery] = useState('')
  const [scope, setScope] = useState<'store' | 'catalog'>('store')
  const [lowStock, setLowStock] = useState(false)
  const [allStores, setAllStores] = useState(false)
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<ProductRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [scanOpen, setScanOpen] = useState(false)
  const requestId = useRef(0)

  useEffect(() => {
    if (stores.length < 2) setAllStores(false)
  }, [stores.length])
  useEffect(() => setPage(1), [query, scope, lowStock, allStores, storeId])

  useEffect(() => {
    if (!storeId) return undefined
    if (scope === 'catalog' && query.trim().length < 2) {
      setItems([])
      setTotal(0)
      return undefined
    }
    const id = ++requestId.current
    const timer = window.setTimeout(async () => {
      setLoading(true)
      try {
        const params = { q: query.trim(), lowStock: scope === 'store' && lowStock ? true : undefined, page, pageSize: PAGE_SIZE }
        const res = scope === 'store' && allStores ? await retailApi.allProducts(params) : await retailApi.products(storeId, { ...params, scope })
        if (id !== requestId.current) return
        setItems(res.items)
        setTotal(res.total)
      } catch (e) {
        if (id === requestId.current) showNotification({ message: errorMessage(e, 'Ürünler yüklenemedi.'), variant: 'danger' })
      } finally {
        if (id === requestId.current) setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [storeId, query, scope, lowStock, allStores, page])

  const openBarcode = async (barcode: string) => {
    setScanOpen(false)
    if (!storeId) return
    try {
      const p = await retailApi.byBarcode(storeId, barcode)
      navigate(`/urunler/${p.productId}`)
    } catch (e) {
      showNotification({
        message: isNotFound(e) ? `${barcode} barkodlu ürün katalogda yok. Satış ekranından ekleyebilirsiniz.` : errorMessage(e),
        variant: isNotFound(e) ? 'warning' : 'danger',
      })
    }
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <>
      <PageMetaData title="Ürünler" />
      <RetailHeader
        title="Ürünler"
        subtitle={total > 0 ? `${total.toLocaleString('tr-TR')} ürün` : undefined}
        actions={
          <>
            <Button variant="outline-primary" size="sm" onClick={() => setScanOpen(true)}>
              <Icon icon="barcode" className="me-1" /> Barkodla bul
            </Button>
            <StoreSwitcher allowAll allSelected={allStores} onAllChange={setAllStores} />
          </>
        }
      />

      <Card>
        <CardHeader className="border-light">
          <Row className="g-2 align-items-center">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text className="bg-light">
                  <Icon icon="search" />
                </InputGroup.Text>
                <Form.Control value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ürün adı, marka veya barkod" />
              </InputGroup>
            </Col>
            <Col md={6} className="d-flex flex-wrap gap-2 justify-content-md-end">
              <ButtonGroup size="sm">
                <Button variant={scope === 'store' ? 'primary' : 'light'} onClick={() => setScope('store')}>
                  <Icon icon={allStores ? 'stack-2' : 'building-store'} className="me-1" />
                  {allStores ? 'Şubelerim' : 'Mağazam'}
                </Button>
                <Button variant={scope === 'catalog' ? 'primary' : 'light'} onClick={() => setScope('catalog')}>
                  <Icon icon="book" className="me-1" /> Katalog
                </Button>
              </ButtonGroup>
              {scope === 'store' && (
                <Button size="sm" variant={lowStock ? 'warning' : 'light'} onClick={() => setLowStock((v) => !v)}>
                  <Icon icon="alert-triangle" className="me-1" /> Düşük stok
                </Button>
              )}
            </Col>
          </Row>
        </CardHeader>
        <CardBody className="p-0">
          {loading && items.length === 0 ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : items.length === 0 ? (
            scope === 'catalog' ? (
              <EmptyState
                icon="search"
                title={query.trim().length < 2 ? 'Katalogda ara' : 'Sonuç yok'}
                message={query.trim().length < 2 ? 'Ürün adı, marka ya da barkod yazın (en az 2 karakter).' : 'Aramanızı değiştirip tekrar deneyin.'}
              />
            ) : (
              <EmptyState
                icon="packages"
                title={query || lowStock ? 'Sonuç yok' : allStores ? 'Şubelerinizde ürün yok' : 'Mağazanızda ürün yok'}
                message={query || lowStock ? undefined : 'Satış yaptığınız veya stok girdiğiniz ürünler burada listelenir. Tüm kataloğa "Katalog"dan bakabilirsiniz.'}
              />
            )
          ) : (
            <Table hover responsive className="align-middle mb-0">
              <thead className="bg-light-subtle">
                <tr className="text-uppercase fs-xxs">
                  <th>Ürün</th>
                  <th>Barkod</th>
                  <th>Kategori</th>
                  {allStores && scope === 'store' && <th className="text-center">Şube</th>}
                  <th className="text-end">Satış fiyatı</th>
                  <th className="text-end">Stok</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.productId} role="button" onClick={() => navigate(`/urunler/${p.productId}`)}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <ProductThumb uri={p.imageUrl} size={40} />
                        <div className="overflow-hidden">
                          <div className="fw-semibold text-truncate" style={{ maxWidth: 360 }}>
                            {p.name}
                          </div>
                          <div className="text-muted fs-xs">{[p.brand, p.quantity].filter(Boolean).join(' · ')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-muted">{p.barcode}</td>
                    <td className="text-muted">{p.category ?? '—'}</td>
                    {allStores && scope === 'store' && <td className="text-center">{'storeCount' in p ? p.storeCount : ''}</td>}
                    <td className="text-end fw-semibold">{priceText(p)}</td>
                    <td className="text-end">
                      <StockBadge variant={stockVariant(p as Product)}>{fmtQty(p.stockQuantity)}</StockBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
        {pageCount > 1 && (
          <CardBody className="border-top d-flex justify-content-between align-items-center">
            <span className="text-muted fs-sm">
              Sayfa {page} / {pageCount}
            </span>
            <Pagination className="mb-0" size="sm">
              <Pagination.Prev disabled={page === 1} onClick={() => setPage((p) => p - 1)} />
              <Pagination.Next disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)} />
            </Pagination>
          </CardBody>
        )}
      </Card>

      <Modal show={scanOpen} onHide={() => setScanOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Barkodla ürün bul</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <BarcodeInput onBarcode={openBarcode} onPickProduct={(p) => navigate(`/urunler/${p.productId}`)} />
        </Modal.Body>
      </Modal>
    </>
  )
}

export default UrunlerPage
