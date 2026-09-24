import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import api from '@/lib/api'
import DataTable from '@/components/table/DataTable'
import TablePagination from '@/components/table/TablePagination'
import { createColumnHelper, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type SortingState, type ColumnFiltersState } from '@tanstack/react-table'
import { useEffect, useState } from 'react'
import { Badge, Button, Card, CardFooter, CardHeader, Col, Dropdown, Row, Spinner } from 'react-bootstrap'

type Feedback = {
  id: string
  userId: string
  userName: string
  userEmail: string
  buildingId: string | null
  type: number
  subject: string
  message: string
  rating: number | null
  status: number
  isRead: boolean
  createdAt: string
}

const FB_TYPES   = ['Genel', 'Hata', 'Öneri', 'Şikayet']
const FB_STATUS  = ['Yeni', 'İnceleniyor', 'Çözüldü']
const TYPE_COLOR  = ['secondary', 'danger', 'success', 'warning'] as const
const STATUS_COLOR = ['primary', 'warning', 'success'] as const

const col = createColumnHelper<Feedback>()

const GeriBildirimlerPage = () => {
  const [data, setData] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(false)
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [selected, setSelected] = useState<Feedback | null>(null)

  const fetchData = () => {
    setLoading(true)
    api.get<Feedback[]>('/feedback')
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const markRead = async (fb: Feedback) => {
    if (fb.isRead) return
    await api.patch(`/feedback/${fb.id}/read`).catch(() => {})
    setData((d) => d.map((x) => x.id === fb.id ? { ...x, isRead: true } : x))
  }

  const updateStatus = async (fb: Feedback, status: number) => {
    await api.patch(`/feedback/${fb.id}/status`, { status }).catch(() => {})
    setData((d) => d.map((x) => x.id === fb.id ? { ...x, status } : x))
    if (selected?.id === fb.id) setSelected((s) => s ? { ...s, status } : s)
  }

  const deleteFb = async (id: string) => {
    if (!confirm('Bu geri bildirim silinsin mi?')) return
    await api.delete(`/feedback/${id}`).catch(() => {})
    setData((d) => d.filter((x) => x.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  const columns = [
    col.accessor('createdAt', {
      header: 'Tarih',
      cell: (i) => new Date(i.getValue()).toLocaleDateString('tr-TR'),
      size: 100,
    }),
    col.accessor('userName', { header: 'Kullanıcı', size: 140 }),
    col.accessor('type', {
      header: 'Tür',
      cell: (i) => <Badge bg={TYPE_COLOR[i.getValue()]}>{FB_TYPES[i.getValue()]}</Badge>,
      size: 90,
    }),
    col.accessor('subject', { header: 'Konu', size: 180 }),
    col.accessor('rating', {
      header: 'Puan',
      cell: (i) => i.getValue() ? '⭐'.repeat(i.getValue()!) : '—',
      size: 80,
    }),
    col.accessor('status', {
      header: 'Durum',
      cell: (i) => <Badge bg={STATUS_COLOR[i.getValue()]}>{FB_STATUS[i.getValue()]}</Badge>,
      size: 100,
    }),
    col.accessor('isRead', {
      header: 'Okundu',
      cell: (i) => i.getValue()
        ? <Icon icon="solar:check-circle-bold" className="text-success fs-5" />
        : <Icon icon="solar:eye-bold" className="text-muted fs-5" />,
      size: 80,
    }),
    col.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="d-flex gap-1">
          <Button size="sm" variant="outline-primary" onClick={() => { setSelected(row.original); markRead(row.original) }}>
            <Icon icon="solar:eye-bold" />
          </Button>
          <Button size="sm" variant="outline-danger" onClick={() => deleteFb(row.original.id)}>
            <Icon icon="solar:trash-bin-minimalistic-bold" />
          </Button>
        </div>
      ),
      size: 90,
    }),
  ]

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, sorting, columnFilters, pagination },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const unread = data.filter((f) => !f.isRead).length

  return (
    <>
      <PageBreadcrumb title="Geri Bildirimler" subName="Yönetim" />
      <Row>
        <Col xl={selected ? 8 : 12}>
          <Card>
            <CardHeader className="d-flex align-items-center gap-2">
              <h5 className="mb-0 flex-grow-1">
                Geri Bildirimler
                {unread > 0 && <Badge bg="danger" className="ms-2">{unread} yeni</Badge>}
              </h5>
              <input
                className="form-control form-control-sm"
                style={{ maxWidth: 220 }}
                placeholder="Ara..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
              />
              <Button size="sm" variant="outline-secondary" onClick={fetchData}>
                <Icon icon="solar:refresh-bold" />
              </Button>
            </CardHeader>
            {loading ? (
              <div className="text-center py-5"><Spinner /></div>
            ) : (
              <>
                <DataTable table={table} />
                <CardFooter>
                  <TablePagination table={table} />
                </CardFooter>
              </>
            )}
          </Card>
        </Col>

        {selected && (
          <Col xl={4}>
            <Card>
              <CardHeader className="d-flex align-items-center justify-content-between">
                <h6 className="mb-0">Detay</h6>
                <Button size="sm" variant="light" onClick={() => setSelected(null)}>✕</Button>
              </CardHeader>
              <div className="p-3">
                <div className="d-flex gap-2 mb-3">
                  <Badge bg={TYPE_COLOR[selected.type]}>{FB_TYPES[selected.type]}</Badge>
                  <Badge bg={STATUS_COLOR[selected.status]}>{FB_STATUS[selected.status]}</Badge>
                  {selected.rating && <Badge bg="secondary">{'⭐'.repeat(selected.rating)}</Badge>}
                </div>
                <p className="fw-bold mb-1">{selected.subject}</p>
                <p className="text-muted small mb-3">{selected.message}</p>
                <hr />
                <p className="small mb-1"><strong>Gönderen:</strong> {selected.userName}</p>
                <p className="small mb-1"><strong>E-posta:</strong> {selected.userEmail}</p>
                <p className="small mb-3"><strong>Tarih:</strong> {new Date(selected.createdAt).toLocaleString('tr-TR')}</p>
                <div className="d-flex gap-2">
                  <Dropdown>
                    <Dropdown.Toggle size="sm" variant="outline-secondary">Durum Güncelle</Dropdown.Toggle>
                    <Dropdown.Menu>
                      {FB_STATUS.map((s, i) => (
                        <Dropdown.Item key={i} onClick={() => updateStatus(selected, i)} active={selected.status === i}>{s}</Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                  <Button size="sm" variant="outline-danger" onClick={() => deleteFb(selected.id)}>Sil</Button>
                </div>
              </div>
            </Card>
          </Col>
        )}
      </Row>
    </>
  )
}

export default GeriBildirimlerPage
