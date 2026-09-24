import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import api from '@/lib/api'
import { useBuilding } from '@/context/BuildingContext'
import DataTable from '@/components/table/DataTable'
import TablePagination from '@/components/table/TablePagination'
import DeleteConfirmationModal from '@/components/table/DeleteConfirmationModal'
import { createColumnHelper, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type SortingState, type ColumnFiltersState } from '@tanstack/react-table'
import { useEffect, useState } from 'react'
import { Badge, Button, Card, CardFooter, CardHeader, Col, Form, FormSelect, Modal, Row, Spinner } from 'react-bootstrap'

type Building = { id: string; name: string; address: string; type: number; createdAt: string; unitCount: number }

const BUILDING_TYPES = ['Apartman', 'Site']

const columnHelper = createColumnHelper<Building>()

const BinalarPage = () => {
  const { refresh: refreshContext } = useBuilding()
  const [data, setData] = useState<Building[]>([])
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>({})
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Building | null>(null)
  const [form, setForm] = useState({ name: '', address: '', type: 0 })
  const [saving, setSaving] = useState(false)

  const fetchData = () => {
    setLoading(true)
    api.get<Building[]>('/buildings')
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const openAdd = () => {
    setEditTarget(null)
    setForm({ name: '', address: '', type: 0 })
    setShowFormModal(true)
  }

  const openEdit = (b: Building) => {
    setEditTarget(b)
    setForm({ name: b.name, address: b.address, type: b.type })
    setShowFormModal(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editTarget) {
        await api.put(`/buildings/${editTarget.id}`, form)
      } else {
        await api.post('/buildings', form)
      }
      setShowFormModal(false)
      fetchData()
      refreshContext()
    } catch {}
    setSaving(false)
  }

  const handleDelete = async () => {
    const ids = Object.keys(selectedRowIds)
    for (const id of ids) {
      const row = table.getRow(id)
      if (row) await api.delete(`/buildings/${row.original.id}`).catch(() => {})
    }
    setSelectedRowIds({})
    setShowDeleteModal(false)
    fetchData()
    refreshContext()
  }

  const columns = [
    {
      id: 'select',
      header: ({ table: t }: any) => <input type="checkbox" className="form-check-input form-check-input-light fs-14" checked={t.getIsAllRowsSelected()} onChange={t.getToggleAllRowsSelectedHandler()} />,
      cell: ({ row }: any) => <input type="checkbox" className="form-check-input form-check-input-light fs-14" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />,
      enableSorting: false,
    },
    columnHelper.accessor('name', { header: 'Bina Adı' }),
    columnHelper.accessor('address', { header: 'Adres' }),
    columnHelper.accessor('type', {
      header: 'Tip',
      cell: ({ row }) => <Badge bg="secondary">{BUILDING_TYPES[row.original.type] ?? row.original.type}</Badge>,
    }),
    columnHelper.accessor('unitCount', { header: 'Daire Sayısı' }),
    columnHelper.accessor('createdAt', {
      header: 'Oluşturulma',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('tr-TR'),
    }),
    {
      header: 'İşlem',
      cell: ({ row }: any) => (
        <div className="d-flex gap-1">
          <Button size="sm" variant="light" className="btn-icon rounded-circle" onClick={() => openEdit(row.original)}>
            <Icon icon="edit" className="fs-lg" />
          </Button>
          <Button size="sm" variant="light" className="btn-icon rounded-circle" onClick={() => { setSelectedRowIds({ [row.id]: true }); setShowDeleteModal(true) }}>
            <Icon icon="trash" className="fs-lg" />
          </Button>
        </div>
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
      <PageBreadcrumb title="Binalarım" subtitle="Bina Yönetimi" />

      <div className="d-flex justify-content-end mb-3">
        <Button size="sm" variant="primary" className="d-inline-flex align-items-center gap-1" onClick={openAdd}>
          <Icon icon="plus" /> Bina Ekle
        </Button>
      </div>

      <Row>
        <Col xs={12}>
          <Card>
            <CardHeader className="border-light">
              <div className="app-search">
                <input type="search" className="form-control" placeholder="Bina ara..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} />
                <Icon icon="search" className="app-search-icon text-muted" />
              </div>
            </CardHeader>

            {loading ? (
              <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
            ) : (
              <DataTable<Building> table={table} emptyMessage="Henüz bina eklenmemiş" />
            )}

            <CardFooter className="border-0 d-flex align-items-center justify-content-between gap-2">
              <FormSelect size="sm" style={{ width: 'auto' }} value={pagination.pageSize} onChange={(e) => table.setPageSize(Number(e.target.value))}>
                {[5, 10, 20].map((s) => <option key={s} value={s}>{s}</option>)}
              </FormSelect>
              {!loading && table.getRowModel().rows.length > 0 && (
                <TablePagination totalItems={totalItems} start={start} end={end} itemsName="bina" showInfo previousPage={table.previousPage} canPreviousPage={table.getCanPreviousPage()} pageCount={table.getPageCount()} pageIndex={table.getState().pagination.pageIndex} setPageIndex={table.setPageIndex} nextPage={table.nextPage} canNextPage={table.getCanNextPage()} />
              )}
            </CardFooter>
          </Card>
        </Col>
      </Row>

      <Modal show={showFormModal} onHide={() => setShowFormModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editTarget ? 'Bina Düzenle' : 'Yeni Bina'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Bina Adı</Form.Label>
              <Form.Control value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Örn: Gül Apartmanı" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Adres</Form.Label>
              <Form.Control as="textarea" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Tam adres" />
            </Form.Group>
            <Form.Group>
              <Form.Label>Tip</Form.Label>
              <Form.Select value={form.type} onChange={(e) => setForm({ ...form, type: Number(e.target.value) })}>
                <option value={0}>Apartman</option>
                <option value={1}>Site</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowFormModal(false)}>İptal</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || !form.name || !form.address}>
            {saving ? <Spinner size="sm" animation="border" /> : 'Kaydet'}
          </Button>
        </Modal.Footer>
      </Modal>

      <DeleteConfirmationModal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} onConfirm={handleDelete} selectedCount={Object.keys(selectedRowIds).length} itemName="bina" />
    </>
  )
}

export default BinalarPage
