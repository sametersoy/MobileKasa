import PageBreadcrumb from '@/components/PageBreadcrumb'
import BuildingSelect from '@/components/BuildingSelect'
import Icon from '@/components/wrappers/Icon'
import api from '@/lib/api'
import { useBuilding } from '@/context/BuildingContext'
import DataTable from '@/components/table/DataTable'
import TablePagination from '@/components/table/TablePagination'
import DeleteConfirmationModal from '@/components/table/DeleteConfirmationModal'
import { createColumnHelper, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type SortingState, type ColumnFiltersState } from '@tanstack/react-table'
import { useEffect, useState } from 'react'
import { Badge, Button, Card, CardBody, CardFooter, CardHeader, Col, Form, FormSelect, Modal, Row, Spinner } from 'react-bootstrap'

type Transaction = { id: string; buildingId: string; unitId?: string; unitNumber?: string; residentUserId?: string; residentName?: string; type: number; amount: number; category: string; description: string; date: string; createdAt: string }
type Summary = { totalIncome: number; totalExpense: number; balance: number }
type Unit = { id: string; number: string }
type Resident = { id: string; fullName: string; email: string; unitId?: string }

const columnHelper = createColumnHelper<Transaction>()

const today = () => new Date().toISOString().split('T')[0]

const FinansPage = () => {
  const { selectedBuilding } = useBuilding()
  const [data, setData] = useState<Transaction[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [units, setUnits] = useState<Unit[]>([])
  const [residents, setResidents] = useState<Resident[]>([])
  const [residentsLoading, setResidentsLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>({})
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [form, setForm] = useState({ type: 0, amount: '', category: '', description: '', date: today(), unitId: '', residentUserId: '' })
  const [saving, setSaving] = useState(false)

  const fetchResidents = (unitId?: string) => {
    if (!selectedBuilding) return
    setResidentsLoading(true)
    const url = unitId
      ? `/buildings/${selectedBuilding.id}/financial/residents?unitId=${unitId}`
      : `/buildings/${selectedBuilding.id}/financial/residents`
    api.get<Resident[]>(url)
      .then((r) => setResidents(r.data))
      .catch(() => setResidents([]))
      .finally(() => setResidentsLoading(false))
  }

  const fetchData = () => {
    if (!selectedBuilding) return
    setLoading(true)
    Promise.all([
      api.get<Transaction[]>(`/buildings/${selectedBuilding.id}/financial`),
      api.get<Summary>(`/buildings/${selectedBuilding.id}/financial/summary`),
      api.get<Unit[]>(`/buildings/${selectedBuilding.id}/units`),
    ])
      .then(([txRes, sumRes, unitRes]) => {
        setData(txRes.data)
        setSummary(sumRes.data)
        setUnits(unitRes.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [selectedBuilding?.id])

  const openForm = () => {
    setForm({ type: 0, amount: '', category: '', description: '', date: today(), unitId: '', residentUserId: '' })
    fetchResidents()
    setShowFormModal(true)
  }

  const handleUnitChange = (unitId: string) => {
    setForm((prev) => ({ ...prev, unitId, residentUserId: '' }))
    fetchResidents(unitId || undefined)
  }

  const handleSave = async () => {
    if (!selectedBuilding) return
    setSaving(true)
    try {
      await api.post(`/buildings/${selectedBuilding.id}/financial`, {
        type: form.type,
        amount: Number(form.amount),
        category: form.category,
        description: form.description,
        date: form.date || today(),
        unitId: form.unitId || null,
        residentUserId: form.residentUserId || null,
      })
      setShowFormModal(false)
      fetchData()
    } catch {}
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!selectedBuilding) return
    for (const id of Object.keys(selectedRowIds)) {
      const row = table.getRow(id)
      if (row) await api.delete(`/buildings/${selectedBuilding.id}/financial/${row.original.id}`).catch(() => {})
    }
    setSelectedRowIds({})
    setShowDeleteModal(false)
    fetchData()
  }

  const columns = [
    {
      id: 'select',
      header: ({ table: t }: any) => <input type="checkbox" className="form-check-input form-check-input-light fs-14" checked={t.getIsAllRowsSelected()} onChange={t.getToggleAllRowsSelectedHandler()} />,
      cell: ({ row }: any) => <input type="checkbox" className="form-check-input form-check-input-light fs-14" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />,
      enableSorting: false,
    },
    columnHelper.accessor('date', { header: 'Tarih', cell: ({ row }) => row.original.date }),
    columnHelper.accessor('type', {
      header: 'Tür',
      cell: ({ row }) => <Badge bg={row.original.type === 0 ? 'success' : 'danger'}>{row.original.type === 0 ? 'Gelir' : 'Gider'}</Badge>,
    }),
    columnHelper.accessor('unitNumber', {
      header: 'Daire',
      cell: ({ row }) => row.original.unitNumber
        ? <Badge bg="light" text="dark">Daire {row.original.unitNumber}</Badge>
        : <span className="text-muted fs-xs">—</span>,
    }),
    columnHelper.accessor('residentName', {
      header: 'Sakin',
      cell: ({ row }) => row.original.residentName
        ? <span className="fs-sm">{row.original.residentName}</span>
        : <span className="text-muted fs-xs">—</span>,
    }),
    columnHelper.accessor('category', { header: 'Kategori' }),
    columnHelper.accessor('description', { header: 'Açıklama' }),
    columnHelper.accessor('amount', {
      header: 'Tutar',
      cell: ({ row }) => (
        <span className={`fw-bold ${row.original.type === 0 ? 'text-success' : 'text-danger'}`}>
          {row.original.type === 0 ? '+' : '-'}₺{row.original.amount.toLocaleString('tr-TR')}
        </span>
      ),
    }),
    {
      header: 'İşlem',
      cell: ({ row }: any) => (
        <Button size="sm" variant="light" className="btn-icon rounded-circle" onClick={() => { setSelectedRowIds({ [row.id]: true }); setShowDeleteModal(true) }}>
          <Icon icon="trash" className="fs-lg" />
        </Button>
      ),
    },
  ]

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, columnFilters, pagination, rowSelection: selectedRowIds },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    onRowSelectionChange: setSelectedRowIds,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
    enableRowSelection: true,
  })

  const totalItems = table.getFilteredRowModel().rows.length
  const start = pagination.pageIndex * pagination.pageSize + 1
  const end = Math.min(start + pagination.pageSize - 1, totalItems)

  return (
    <>
      <PageBreadcrumb title="Gelir / Gider" subtitle="Finans" />

      <div className="d-flex align-items-center justify-content-between mb-3">
        <BuildingSelect />
        <Button size="sm" variant="primary" className="d-inline-flex align-items-center gap-1" onClick={openForm} disabled={!selectedBuilding}>
          <Icon icon="plus" /> İşlem Ekle
        </Button>
      </div>

      {summary && (
        <Row className="g-3 mb-3">
          {[
            { label: 'Toplam Gelir', value: summary.totalIncome, color: 'success', icon: 'trending-up' },
            { label: 'Toplam Gider', value: summary.totalExpense, color: 'danger', icon: 'trending-down' },
            { label: 'Bakiye', value: summary.balance, color: summary.balance >= 0 ? 'primary' : 'warning', icon: 'wallet' },
          ].map((s) => (
            <Col md={4} key={s.label}>
              <Card className="h-100">
                <CardBody className="d-flex align-items-center gap-3">
                  <span className={`avatar-md bg-${s.color}-subtle text-${s.color} rounded-circle d-flex align-items-center justify-content-center fs-xl`}>
                    <Icon icon={s.icon} />
                  </span>
                  <div>
                    <p className="text-muted fs-sm mb-0">{s.label}</p>
                    <h4 className="mb-0">₺{s.value.toLocaleString('tr-TR')}</h4>
                  </div>
                </CardBody>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Row>
        <Col xs={12}>
          <Card>
            <CardHeader className="border-light">
              <div className="app-search">
                <input type="search" className="form-control" placeholder="İşlem ara..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} />
                <Icon icon="search" className="app-search-icon text-muted" />
              </div>
            </CardHeader>

            {loading ? (
              <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
            ) : (
              <DataTable<Transaction> table={table} emptyMessage="Kayıtlı işlem bulunamadı" />
            )}

            <CardFooter className="border-0 d-flex align-items-center justify-content-between gap-2">
              <FormSelect size="sm" style={{ width: 'auto' }} value={pagination.pageSize} onChange={(e) => table.setPageSize(Number(e.target.value))}>
                {[5, 10, 20].map((s) => <option key={s} value={s}>{s}</option>)}
              </FormSelect>
              {!loading && table.getRowModel().rows.length > 0 && (
                <TablePagination totalItems={totalItems} start={start} end={end} itemsName="işlem" showInfo previousPage={table.previousPage} canPreviousPage={table.getCanPreviousPage()} pageCount={table.getPageCount()} pageIndex={table.getState().pagination.pageIndex} setPageIndex={table.setPageIndex} nextPage={table.nextPage} canNextPage={table.getCanNextPage()} />
              )}
            </CardFooter>
          </Card>
        </Col>
      </Row>

      <Modal show={showFormModal} onHide={() => setShowFormModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Yeni İşlem</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="g-3">
              <Col xs={6}>
                <Form.Group>
                  <Form.Label>Tür</Form.Label>
                  <Form.Select value={form.type} onChange={(e) => setForm({ ...form, type: Number(e.target.value) })}>
                    <option value={0}>Gelir</option>
                    <option value={1}>Gider</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group>
                  <Form.Label>Tutar (₺)</Form.Label>
                  <Form.Control type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group>
                  <Form.Label>Daire <small className="text-muted">(isteğe bağlı)</small></Form.Label>
                  <Form.Select value={form.unitId} onChange={(e) => handleUnitChange(e.target.value)}>
                    <option value="">— Daireye bağlı değil</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        Daire {u.number} — {selectedBuilding?.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group>
                  <Form.Label>
                    Daire Sakini <small className="text-muted">(isteğe bağlı)</small>
                    {residentsLoading && <Spinner size="sm" animation="border" className="ms-1" />}
                  </Form.Label>
                  <Form.Select
                    value={form.residentUserId}
                    onChange={(e) => setForm({ ...form, residentUserId: e.target.value })}
                    disabled={residentsLoading}
                  >
                    <option value="">— Sakine bağlı değil</option>
                    {residents.map((r) => (
                      <option key={r.id} value={r.id}>{r.fullName}</option>
                    ))}
                  </Form.Select>
                  {!residentsLoading && form.unitId && residents.length === 0 && (
                    <Form.Text className="text-muted">Bu daireye kayıtlı sakin yok</Form.Text>
                  )}
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group>
                  <Form.Label>Kategori</Form.Label>
                  <Form.Control value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Aidat, Temizlik..." />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group>
                  <Form.Label>Tarih <small className="text-muted">(boş = bugün)</small></Form.Label>
                  <Form.Control type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group>
                  <Form.Label>Açıklama</Form.Label>
                  <Form.Control as="textarea" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowFormModal(false)}>İptal</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || !form.amount}>
            {saving ? <Spinner size="sm" animation="border" /> : 'Kaydet'}
          </Button>
        </Modal.Footer>
      </Modal>

      <DeleteConfirmationModal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} onConfirm={handleDelete} selectedCount={Object.keys(selectedRowIds).length} itemName="işlem" />
    </>
  )
}

export default FinansPage
