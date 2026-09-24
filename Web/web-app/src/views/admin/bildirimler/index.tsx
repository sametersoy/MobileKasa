import PageBreadcrumb from '@/components/PageBreadcrumb'
import BuildingSelect from '@/components/BuildingSelect'
import Icon from '@/components/wrappers/Icon'
import api from '@/lib/api'
import { useBuilding } from '@/context/BuildingContext'
import DataTable from '@/components/table/DataTable'
import TablePagination from '@/components/table/TablePagination'
import { createColumnHelper, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type SortingState, type ColumnFiltersState } from '@tanstack/react-table'
import { useEffect, useState } from 'react'
import { Badge, Button, Card, CardFooter, CardHeader, Col, Form, FormSelect, Modal, Row, Spinner } from 'react-bootstrap'

type Notification = { id: string; buildingId: string; title: string; body: string; type: number; isRead: boolean; createdAt: string }

const NOTIF_TYPES = ['Genel', 'Aidat', 'İhale', 'Anket', 'Bakım']
const NOTIF_COLORS = ['secondary', 'warning', 'info', 'primary', 'danger']

const col = createColumnHelper<Notification>()

const BildirimlerPage = () => {
  const { selectedBuilding } = useBuilding()
  const [data, setData] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', body: '', type: 0, targetUserId: '' })
  const [saving, setSaving] = useState(false)

  const fetchData = () => {
    if (!selectedBuilding) return
    setLoading(true)
    api.get<Notification[]>(`/buildings/${selectedBuilding.id}/notifications`)
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [selectedBuilding?.id])

  const handleMarkRead = async (id: string) => {
    if (!selectedBuilding) return
    await api.patch(`/buildings/${selectedBuilding.id}/notifications/${id}/read`).catch(() => {})
    fetchData()
  }

  const handleSend = async () => {
    if (!selectedBuilding) return
    setSaving(true)
    try {
      await api.post(`/buildings/${selectedBuilding.id}/notifications`, {
        ...form,
        targetUserId: form.targetUserId || null,
      })
      setShowModal(false)
      setForm({ title: '', body: '', type: 0, targetUserId: '' })
      fetchData()
    } catch {}
    setSaving(false)
  }

  const columns = [
    col.accessor('type', {
      header: 'Tip',
      cell: ({ row }) => <Badge bg={NOTIF_COLORS[row.original.type] ?? 'secondary'}>{NOTIF_TYPES[row.original.type] ?? row.original.type}</Badge>,
    }),
    col.accessor('title', {
      header: 'Başlık',
      cell: ({ row }) => (
        <span className={row.original.isRead ? '' : 'fw-bold'}>
          {row.original.title}
        </span>
      ),
    }),
    col.accessor('body', { header: 'İçerik' }),
    col.accessor('createdAt', {
      header: 'Tarih',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('tr-TR'),
    }),
    col.accessor('isRead', {
      header: 'Durum',
      cell: ({ row }) => <Badge bg={row.original.isRead ? 'success' : 'warning'}>{row.original.isRead ? 'Okundu' : 'Yeni'}</Badge>,
    }),
    {
      header: 'İşlem',
      cell: ({ row }: any) => !row.original.isRead ? (
        <Button size="sm" variant="outline-success" onClick={() => handleMarkRead(row.original.id)}>
          <Icon icon="check" className="me-1" /> Okundu
        </Button>
      ) : null,
    },
  ]

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, columnFilters, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
  })

  const totalItems = table.getFilteredRowModel().rows.length
  const start = pagination.pageIndex * pagination.pageSize + 1
  const end = Math.min(start + pagination.pageSize - 1, totalItems)

  return (
    <>
      <PageBreadcrumb title="Bildirimler" subtitle="İletişim" />

      <div className="d-flex align-items-center justify-content-between mb-3">
        <BuildingSelect />
        <Button size="sm" variant="primary" className="d-inline-flex align-items-center gap-1" onClick={() => setShowModal(true)} disabled={!selectedBuilding}>
          <Icon icon="send" /> Bildirim Gönder
        </Button>
      </div>

      <Row>
        <Col xs={12}>
          <Card>
            <CardHeader className="border-light">
              <div className="app-search">
                <input type="search" className="form-control" placeholder="Bildirim ara..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} />
                <Icon icon="search" className="app-search-icon text-muted" />
              </div>
            </CardHeader>

            {loading ? (
              <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
            ) : (
              <DataTable<Notification> table={table} emptyMessage="Bildirim bulunamadı" />
            )}

            <CardFooter className="border-0 d-flex align-items-center justify-content-between gap-2">
              <FormSelect size="sm" style={{ width: 'auto' }} value={pagination.pageSize} onChange={(e) => table.setPageSize(Number(e.target.value))}>
                {[5, 10, 20].map((s) => <option key={s} value={s}>{s}</option>)}
              </FormSelect>
              {!loading && table.getRowModel().rows.length > 0 && (
                <TablePagination totalItems={totalItems} start={start} end={end} itemsName="bildirim" showInfo previousPage={table.previousPage} canPreviousPage={table.getCanPreviousPage()} pageCount={table.getPageCount()} pageIndex={table.getState().pagination.pageIndex} setPageIndex={table.setPageIndex} nextPage={table.nextPage} canNextPage={table.getCanNextPage()} />
              )}
            </CardFooter>
          </Card>
        </Col>
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Bildirim Gönder</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Bildirim Tipi</Form.Label>
              <Form.Select value={form.type} onChange={(e) => setForm({ ...form, type: Number(e.target.value) })}>
                {NOTIF_TYPES.map((t, i) => <option key={i} value={i}>{t}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Başlık</Form.Label>
              <Form.Control value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Bildirim başlığı" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>İçerik</Form.Label>
              <Form.Control as="textarea" rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Bildirim içeriği" />
            </Form.Group>
            <Form.Group>
              <Form.Label>Hedef Kullanıcı ID <small className="text-muted">(boş bırakılırsa tüm sakinlere)</small></Form.Label>
              <Form.Control value={form.targetUserId} onChange={(e) => setForm({ ...form, targetUserId: e.target.value })} placeholder="UUID (isteğe bağlı)" />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>İptal</Button>
          <Button variant="primary" onClick={handleSend} disabled={saving || !form.title || !form.body}>
            {saving ? <Spinner size="sm" animation="border" /> : 'Gönder'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default BildirimlerPage
