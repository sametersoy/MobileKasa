import PageMetaData from '@/components/PageMetaData'
import Icon from '@/components/wrappers/Icon'
import { EmptyState, RetailHeader, StoreSwitcher } from '@/components/retail'
import { useStore } from '@/context/StoreContext'
import { useNotificationContext } from '@/context/useNotificationContext'
import { fmt, fmtDateTime, fmtQty } from '@/lib/format'
import { errorMessage, retailApi, type Purchase, type Supplier } from '@/lib/retail'
import { useEffect, useState } from 'react'
import { Card, CardBody, CardHeader, Form, Modal, Pagination, Spinner, Table } from 'react-bootstrap'
import { Link, useNavigate, useSearchParams } from 'react-router'

const PAGE_SIZE = 25

const StokGirisleriPage = () => {
  const navigate = useNavigate()
  const { storeId } = useStore()
  const { showNotification } = useNotificationContext()
  const [params, setParams] = useSearchParams()
  const supplierId = params.get('supplierId') ?? ''

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [items, setItems] = useState<Purchase[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Purchase | null>(null)

  useEffect(() => {
    if (storeId) retailApi.suppliers(storeId).then(setSuppliers).catch(() => setSuppliers([]))
  }, [storeId])
  useEffect(() => setPage(1), [storeId, supplierId])

  useEffect(() => {
    if (!storeId) return
    setLoading(true)
    retailApi
      .purchases(storeId, { supplierId: supplierId || undefined, page, pageSize: PAGE_SIZE })
      .then((res) => {
        setItems(res.items)
        setTotal(res.total)
      })
      .catch((e) => showNotification({ message: errorMessage(e, 'Stok girişleri yüklenemedi.'), variant: 'danger' }))
      .finally(() => setLoading(false))
  }, [storeId, supplierId, page])

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <>
      <PageMetaData title="Stok Girişleri" />
      <RetailHeader
        title="Stok Girişleri"
        subtitle={total > 0 ? `${total} kayıt` : undefined}
        actions={
          <>
            <Link to="/stok-girisi" className="btn btn-sm btn-primary">
              <Icon icon="plus" className="me-1" /> Yeni Stok Girişi
            </Link>
            <StoreSwitcher />
          </>
        }
      />

      <Card>
        <CardHeader className="border-light">
          <Form.Select
            style={{ maxWidth: 320 }}
            value={supplierId}
            onChange={(e) => (e.target.value ? setParams({ supplierId: e.target.value }) : setParams({}))}
          >
            <option value="">Tüm tedarikçiler</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Form.Select>
        </CardHeader>
        <CardBody className="p-0">
          {loading && items.length === 0 ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState icon="truck-delivery" title="Stok girişi yok" message="Stok Girişi sayfasından kaydettiğiniz alışlar burada listelenir." />
          ) : (
            <Table hover responsive className="align-middle mb-0">
              <thead className="bg-light-subtle">
                <tr className="text-uppercase fs-xxs">
                  <th>Tarih</th>
                  <th>Tedarikçi</th>
                  <th>Belge no</th>
                  <th className="text-center">Kalem</th>
                  <th className="text-end">Tutar</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} role="button" onClick={() => setSelected(p)}>
                    <td>{fmtDateTime(p.createdAt)}</td>
                    <td className="fw-semibold">{p.supplierName ?? <span className="text-muted fw-normal">Tedarikçisiz</span>}</td>
                    <td className="text-muted">{p.documentNo ?? '—'}</td>
                    <td className="text-center">{p.itemCount}</td>
                    <td className="text-end fw-semibold">{fmt(p.totalAmount)}</td>
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

      <Modal show={!!selected} onHide={() => setSelected(null)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Stok Girişi
            <div className="text-muted fs-sm fw-normal">
              {selected?.supplierName ?? 'Tedarikçisiz'} · {selected && fmtDateTime(selected.createdAt)}
              {selected?.documentNo ? ` · Belge: ${selected.documentNo}` : ''}
            </div>
          </Modal.Title>
        </Modal.Header>
        <Table hover className="align-middle mb-0">
          <thead className="bg-light-subtle">
            <tr className="text-uppercase fs-xxs">
              <th>Ürün</th>
              <th className="text-end">Miktar</th>
              <th className="text-end">Birim alış</th>
              <th className="text-end">Tutar</th>
            </tr>
          </thead>
          <tbody>
            {selected?.items.map((i) => (
              <tr key={i.productId} role="button" onClick={() => navigate(`/urunler/${i.productId}`)}>
                <td>
                  <div className="fw-semibold">{i.productName}</div>
                  <div className="text-muted fs-xs">{i.barcode}</div>
                </td>
                <td className="text-end">{fmtQty(i.quantity)}</td>
                <td className="text-end">{fmt(i.unitCost)}</td>
                <td className="text-end fw-semibold">{fmt(i.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="text-end fw-semibold">
                Toplam
              </td>
              <td className="text-end fw-bold fs-5">{selected && fmt(selected.totalAmount)}</td>
            </tr>
          </tfoot>
        </Table>
      </Modal>
    </>
  )
}

export default StokGirisleriPage
