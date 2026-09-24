import PageMetaData from '@/components/PageMetaData'
import { EmptyState, RetailHeader, StatCard, StoreSwitcher } from '@/components/retail'
import { useStore } from '@/context/StoreContext'
import { useNotificationContext } from '@/context/useNotificationContext'
import { fmt, fmtDateTime, fmtQty, PAYMENT_LABELS, startOfDay } from '@/lib/format'
import { errorMessage, retailApi, type Sale, type SalesSummary } from '@/lib/retail'
import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, ButtonGroup, Card, CardBody, CardHeader, Col, Form, Modal, Pagination, ProgressBar, Row, Spinner, Table } from 'react-bootstrap'
import { useNavigate } from 'react-router'

const PAGE_SIZE = 25

const RANGES = [
  { key: 'today', label: 'Bugün', from: () => startOfDay(0), to: () => startOfDay(1) },
  { key: 'yesterday', label: 'Dün', from: () => startOfDay(-1), to: () => startOfDay(0) },
  { key: 'week', label: '7 gün', from: () => startOfDay(-6), to: () => startOfDay(1) },
  { key: 'month', label: '30 gün', from: () => startOfDay(-29), to: () => startOfDay(1) },
] as const

const dateInput = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const SatislarPage = () => {
  const { storeId, stores, selectStore } = useStore()
  const { showNotification } = useNotificationContext()

  const [range, setRange] = useState<string>('today')
  const [customFrom, setCustomFrom] = useState(dateInput(startOfDay(-6)))
  const [customTo, setCustomTo] = useState(dateInput(startOfDay(0)))
  const [allStores, setAllStores] = useState(false)
  const [page, setPage] = useState(1)
  const [summary, setSummary] = useState<SalesSummary | null>(null)
  const [sales, setSales] = useState<Sale[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Sale | null>(null)

  useEffect(() => {
    if (stores.length < 2) setAllStores(false)
  }, [stores.length])

  const params = useMemo(() => {
    if (range === 'custom') {
      const from = new Date(`${customFrom}T00:00:00`)
      const to = new Date(`${customTo}T00:00:00`)
      to.setDate(to.getDate() + 1)
      return { from: from.toISOString(), to: to.toISOString() }
    }
    const r = RANGES.find((x) => x.key === range)!
    return { from: r.from().toISOString(), to: r.to().toISOString() }
  }, [range, customFrom, customTo])

  useEffect(() => setPage(1), [params, allStores, storeId])

  useEffect(() => {
    if (!storeId) return
    setLoading(true)
    const listParams = { ...params, page, pageSize: PAGE_SIZE }
    Promise.all([
      allStores ? retailApi.allSales(listParams) : retailApi.sales(storeId, listParams),
      allStores ? retailApi.allSalesSummary(params) : retailApi.salesSummary(storeId, params),
    ])
      .then(([list, sum]) => {
        setSales(list.items)
        setTotal(list.total)
        setSummary(sum)
      })
      .catch((e) => showNotification({ message: errorMessage(e, 'Satışlar yüklenemedi.'), variant: 'danger' }))
      .finally(() => setLoading(false))
  }, [storeId, params, allStores, page])

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <>
      <PageMetaData title="Satışlar" />
      <RetailHeader
        title="Satışlar"
        actions={
          <>
            <ButtonGroup size="sm">
              {RANGES.map((r) => (
                <Button key={r.key} variant={range === r.key ? 'primary' : 'light'} onClick={() => setRange(r.key)}>
                  {r.label}
                </Button>
              ))}
              <Button variant={range === 'custom' ? 'primary' : 'light'} onClick={() => setRange('custom')}>
                Tarih aralığı
              </Button>
            </ButtonGroup>
            <StoreSwitcher allowAll allSelected={allStores} onAllChange={setAllStores} />
          </>
        }
      />

      {range === 'custom' && (
        <Card>
          <CardBody className="d-flex flex-wrap gap-2 align-items-center">
            <Form.Control type="date" style={{ maxWidth: 180 }} value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
            <span className="text-muted">—</span>
            <Form.Control type="date" style={{ maxWidth: 180 }} value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
          </CardBody>
        </Card>
      )}

      {summary && (
        <Row className="g-3 mb-3">
          <Col sm={6} xl={3}>
            <StatCard label="Ciro" value={fmt(summary.totalAmount)} icon="chart-line" hint={`İçindeki KDV ${fmt(summary.vatAmount)}`} />
          </Col>
          <Col sm={6} xl={3}>
            <StatCard label="Satış" value={`${summary.saleCount} adet`} icon="receipt" variant="purple" />
          </Col>
          <Col sm={6} xl={3}>
            <StatCard label="Nakit" value={fmt(summary.cashAmount)} icon="cash" variant="success" />
          </Col>
          <Col sm={6} xl={3}>
            <StatCard label="Kart" value={fmt(summary.cardAmount)} icon="credit-card" variant="info" />
          </Col>
        </Row>
      )}

      {allStores && summary?.byStore && summary.byStore.length > 0 && (
        <Card>
          <CardHeader>
            <h5 className="card-title mb-0">Şubelere göre</h5>
          </CardHeader>
          <CardBody>
            {summary.byStore.map((b) => (
              <div
                key={b.storeId}
                className="mb-3"
                role="button"
                onClick={() => {
                  selectStore(b.storeId)
                  setAllStores(false)
                }}
              >
                <div className="d-flex justify-content-between mb-1">
                  <span className="fw-semibold">{b.storeName}</span>
                  <span>
                    <span className="text-muted me-3">{b.saleCount} satış</span>
                    <strong>{fmt(b.totalAmount)}</strong>
                  </span>
                </div>
                <ProgressBar now={summary.totalAmount > 0 ? (b.totalAmount / summary.totalAmount) * 100 : 0} style={{ height: 6 }} />
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody className="p-0">
          {loading && sales.length === 0 ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : sales.length === 0 ? (
            <EmptyState icon="receipt" title="Satış yok" message="Seçilen tarih aralığında satış bulunmuyor." />
          ) : (
            <Table hover responsive className="align-middle mb-0">
              <thead className="bg-light-subtle">
                <tr className="text-uppercase fs-xxs">
                  <th>Tarih</th>
                  {allStores && <th>Şube</th>}
                  <th>Ürünler</th>
                  <th className="text-center">Kalem</th>
                  <th>Ödeme</th>
                  <th className="text-end">Tutar</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s.id} role="button" onClick={() => setSelected(s)}>
                    <td className="text-nowrap">{fmtDateTime(s.createdAt)}</td>
                    {allStores && <td>{s.storeName}</td>}
                    <td>
                      <span className="text-truncate d-inline-block" style={{ maxWidth: 380 }}>
                        {s.items.map((i) => i.productName).join(', ')}
                      </span>
                    </td>
                    <td className="text-center">{s.itemCount}</td>
                    <td>
                      <Badge bg={s.paymentMethod === 1 ? 'info-subtle' : 'success-subtle'} className={s.paymentMethod === 1 ? 'text-info' : 'text-success'}>
                        {PAYMENT_LABELS[s.paymentMethod]}
                      </Badge>
                    </td>
                    <td className="text-end fw-semibold">{fmt(s.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
        {pageCount > 1 && (
          <CardBody className="border-top d-flex justify-content-between align-items-center">
            <span className="text-muted fs-sm">
              Sayfa {page} / {pageCount} · {total} satış
            </span>
            <Pagination className="mb-0" size="sm">
              <Pagination.Prev disabled={page === 1} onClick={() => setPage((p) => p - 1)} />
              <Pagination.Next disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)} />
            </Pagination>
          </CardBody>
        )}
      </Card>

      <SaleDetailModal sale={selected} onClose={() => setSelected(null)} />
    </>
  )
}

export const SaleDetailModal = ({ sale, onClose }: { sale: Sale | null; onClose: () => void }) => {
  const navigate = useNavigate()
  return (
    <Modal show={!!sale} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          Satış Fişi
          <div className="text-muted fs-sm fw-normal">
            {sale?.storeName ? `${sale.storeName} · ` : ''}
            {sale && fmtDateTime(sale.createdAt)} · {sale && PAYMENT_LABELS[sale.paymentMethod]}
          </div>
        </Modal.Title>
      </Modal.Header>
      <Table hover className="align-middle mb-0">
        <thead className="bg-light-subtle">
          <tr className="text-uppercase fs-xxs">
            <th>Ürün</th>
            <th className="text-end">Adet</th>
            <th className="text-end">Birim fiyat</th>
            <th className="text-end">Tutar</th>
          </tr>
        </thead>
        <tbody>
          {sale?.items.map((i) => (
            <tr key={i.productId} role="button" onClick={() => navigate(`/urunler/${i.productId}`)}>
              <td>
                <div className="fw-semibold">{i.productName}</div>
                <div className="text-muted fs-xs">{i.barcode}</div>
              </td>
              <td className="text-end">{fmtQty(i.quantity)}</td>
              <td className="text-end">{fmt(i.unitPrice)}</td>
              <td className="text-end fw-semibold">{fmt(i.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="text-end text-muted">
              KDV (dahil)
            </td>
            <td className="text-end text-muted">{sale && fmt(sale.vatAmount)}</td>
          </tr>
          <tr>
            <td colSpan={3} className="text-end fw-semibold">
              Toplam
            </td>
            <td className="text-end fw-bold fs-5">{sale && fmt(sale.totalAmount)}</td>
          </tr>
        </tfoot>
      </Table>
    </Modal>
  )
}

export default SatislarPage
