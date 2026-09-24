import PageMetaData from '@/components/PageMetaData'
import Icon from '@/components/wrappers/Icon'
import { EmptyState, ProductThumb, RetailHeader, StatCard, StockBadge, StoreSwitcher } from '@/components/retail'
import { useStore } from '@/context/StoreContext'
import { fmt, fmtQty, fmtTime, PAYMENT_LABELS, startOfDay, stockVariant } from '@/lib/format'
import { retailApi, type AllStoresProduct, type Product, type Sale, type SalesSummary } from '@/lib/retail'
import { SaleDetailModal } from '@/views/retail/satislar'
import { useEffect, useState } from 'react'
import { Card, CardHeader, Col, Row, Table } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router'

// Günün özeti: ciro, satışlar, düşük stok ve hızlı erişim
const PanelPage = () => {
  const navigate = useNavigate()
  const { store, storeId, stores } = useStore()
  const [allStores, setAllStores] = useState(false)
  const [summary, setSummary] = useState<SalesSummary | null>(null)
  const [sales, setSales] = useState<Sale[]>([])
  const [lowStock, setLowStock] = useState<(Product | AllStoresProduct)[]>([])
  const [lowStockTotal, setLowStockTotal] = useState(0)
  const [selected, setSelected] = useState<Sale | null>(null)

  useEffect(() => {
    if (stores.length < 2) setAllStores(false)
  }, [stores.length])

  useEffect(() => {
    if (!storeId) return
    const today = { from: startOfDay(0).toISOString(), to: startOfDay(1).toISOString() }
    Promise.all([
      allStores ? retailApi.allSalesSummary(today) : retailApi.salesSummary(storeId, today),
      allStores ? retailApi.allSales({ ...today, pageSize: 8 }) : retailApi.sales(storeId, { ...today, pageSize: 8 }),
      allStores ? retailApi.allProducts({ lowStock: true, pageSize: 8 }) : retailApi.products(storeId, { lowStock: true, pageSize: 8 }),
    ])
      .then(([sum, list, low]) => {
        setSummary(sum)
        setSales(list.items)
        setLowStock(low.items)
        setLowStockTotal(low.total)
      })
      .catch(() => {})
  }, [storeId, allStores])

  const average = summary && summary.saleCount > 0 ? summary.totalAmount / summary.saleCount : 0

  return (
    <>
      <PageMetaData title="Panel" />
      <RetailHeader
        title={`Merhaba${store ? `, ${allStores ? 'tüm şubeler' : store.name}` : ''}`}
        subtitle={new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })}
        actions={
          <>
            <Link to="/satis" className="btn btn-sm btn-primary">
              <Icon icon="cash-register" className="me-1" /> Satış Yap
            </Link>
            <Link to="/stok-girisi" className="btn btn-sm btn-outline-primary">
              <Icon icon="truck-delivery" className="me-1" /> Stok Girişi
            </Link>
            <StoreSwitcher allowAll allSelected={allStores} onAllChange={setAllStores} />
          </>
        }
      />

      <Row className="g-3 mb-3">
        <Col sm={6} xl={3}>
          <StatCard label="Bugünkü ciro" value={fmt(summary?.totalAmount)} icon="chart-line" hint={`KDV ${fmt(summary?.vatAmount)}`} />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard label="Satış" value={`${summary?.saleCount ?? 0} adet`} icon="receipt" variant="purple" hint={`Ortalama sepet ${fmt(average)}`} />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard label="Nakit / Kart" value={`${fmt(summary?.cashAmount)}`} icon="cash" variant="success" hint={`Kart ${fmt(summary?.cardAmount)}`} />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard label="Düşük stok" value={`${lowStockTotal} ürün`} icon="alert-triangle" variant={lowStockTotal > 0 ? 'warning' : 'success'} />
        </Col>
      </Row>

      <Row className="g-3">
        <Col xl={7}>
          <Card className="h-100 mb-0">
            <CardHeader className="d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Bugünkü satışlar</h5>
              <Link to="/satislar" className="fs-sm">
                Tümü
              </Link>
            </CardHeader>
            {sales.length === 0 ? (
              <EmptyState icon="receipt" title="Bugün henüz satış yok" />
            ) : (
              <Table hover className="align-middle mb-0">
                <tbody>
                  {sales.map((s) => (
                    <tr key={s.id} role="button" onClick={() => setSelected(s)}>
                      <td className="text-muted" style={{ width: 70 }}>
                        {fmtTime(s.createdAt)}
                      </td>
                      <td>
                        <span className="text-truncate d-inline-block" style={{ maxWidth: 320 }}>
                          {s.items.map((i) => i.productName).join(', ')}
                        </span>
                        <div className="text-muted fs-xs">
                          {allStores && s.storeName ? `${s.storeName} · ` : ''}
                          {s.itemCount} kalem · {PAYMENT_LABELS[s.paymentMethod]}
                        </div>
                      </td>
                      <td className="text-end fw-semibold">{fmt(s.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </Col>
        <Col xl={5}>
          <Card className="h-100 mb-0">
            <CardHeader className="d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Düşük stok</h5>
              <Link to="/urunler" className="fs-sm">
                Ürünler
              </Link>
            </CardHeader>
            {lowStock.length === 0 ? (
              <EmptyState icon="circle-check" title="Stoklar yeterli" message="Minimum seviyenin altına düşen ürün yok." />
            ) : (
              <Table hover className="align-middle mb-0">
                <tbody>
                  {lowStock.map((p) => (
                    <tr key={p.productId} role="button" onClick={() => navigate(`/urunler/${p.productId}`)}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <ProductThumb uri={p.imageUrl} size={32} />
                          <span className="text-truncate" style={{ maxWidth: 240 }}>
                            {p.name}
                          </span>
                        </div>
                      </td>
                      <td className="text-end">
                        <StockBadge variant={stockVariant(p as Product)}>{fmtQty(p.stockQuantity)}</StockBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </Col>
      </Row>

      <SaleDetailModal sale={selected} onClose={() => setSelected(null)} />
    </>
  )
}

export default PanelPage
