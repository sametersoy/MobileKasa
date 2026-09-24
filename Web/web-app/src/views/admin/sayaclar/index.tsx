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
import { Badge, Button, Card, CardFooter, CardHeader, Col, Form, FormSelect, Modal, Row, Spinner } from 'react-bootstrap'

type Meter = { id: string; unitId: string; unitNumber: string; type: number; serialNumber: string }
type Reading = { id: string; meterId: string; readingDate: string; value: number; previousValue: number; unitPrice: number; amount: number }

const METER_TYPES = [
  { label: 'Elektrik', icon: 'bolt', color: 'warning' },
  { label: 'Doğalgaz', icon: 'flame', color: 'danger' },
  { label: 'Su', icon: 'droplet', color: 'info' },
]

const colMeter = createColumnHelper<Meter>()

const SayaclarPage = () => {
  const { selectedBuilding } = useBuilding()
  const [meters, setMeters] = useState<Meter[]>([])
  const [readings, setReadings] = useState<Reading[]>([])
  const [selectedMeter, setSelectedMeter] = useState<Meter | null>(null)
  const [loading, setLoading] = useState(false)
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>({})
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showMeterModal, setShowMeterModal] = useState(false)
  const [showReadingModal, setShowReadingModal] = useState(false)
  const [meterForm, setMeterForm] = useState({ unitId: '', type: 0, serialNumber: '' })
  const [readingForm, setReadingForm] = useState({ readingDate: '', value: '', unitPrice: '' })
  const [units, setUnits] = useState<{ id: string; number: string }[]>([])
  const [saving, setSaving] = useState(false)

  const fetchMeters = () => {
    if (!selectedBuilding) return
    setLoading(true)
    Promise.all([
      api.get<Meter[]>(`/buildings/${selectedBuilding.id}/meters`),
      api.get<{ id: string; number: string }[]>(`/buildings/${selectedBuilding.id}/units`),
    ])
      .then(([mRes, uRes]) => { setMeters(mRes.data); setUnits(uRes.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const fetchReadings = (meter: Meter) => {
    setSelectedMeter(meter)
    api.get<Reading[]>(`/buildings/${selectedBuilding!.id}/meters/${meter.id}/readings`)
      .then((r) => setReadings(r.data))
      .catch(() => setReadings([]))
  }

  useEffect(() => { fetchMeters() }, [selectedBuilding?.id])

  const handleSaveMeter = async () => {
    if (!selectedBuilding) return
    setSaving(true)
    try {
      await api.post(`/buildings/${selectedBuilding.id}/meters`, meterForm)
      setShowMeterModal(false)
      setMeterForm({ unitId: '', type: 0, serialNumber: '' })
      fetchMeters()
    } catch {}
    setSaving(false)
  }

  const handleSaveReading = async () => {
    if (!selectedBuilding || !selectedMeter) return
    setSaving(true)
    try {
      await api.post(`/buildings/${selectedBuilding.id}/meters/${selectedMeter.id}/readings`, {
        ...readingForm,
        value: Number(readingForm.value),
        unitPrice: Number(readingForm.unitPrice),
      })
      setShowReadingModal(false)
      setReadingForm({ readingDate: '', value: '', unitPrice: '' })
      fetchReadings(selectedMeter)
    } catch {}
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!selectedBuilding) return
    for (const id of Object.keys(selectedRowIds)) {
      const row = table.getRow(id)
      if (row) await api.delete(`/buildings/${selectedBuilding.id}/meters/${row.original.id}`).catch(() => {})
    }
    setSelectedRowIds({})
    setShowDeleteModal(false)
    setSelectedMeter(null)
    fetchMeters()
  }

  const meterColumns = [
    {
      id: 'select',
      header: ({ table: t }: any) => <input type="checkbox" className="form-check-input form-check-input-light fs-14" checked={t.getIsAllRowsSelected()} onChange={t.getToggleAllRowsSelectedHandler()} />,
      cell: ({ row }: any) => <input type="checkbox" className="form-check-input form-check-input-light fs-14" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />,
      enableSorting: false,
    },
    colMeter.accessor('unitNumber', { header: 'Daire' }),
    colMeter.accessor('type', {
      header: 'Tip',
      cell: ({ row }) => {
        const mt = METER_TYPES[row.original.type]
        return <Badge bg={mt?.color ?? 'secondary'}>{mt?.label ?? row.original.type}</Badge>
      },
    }),
    colMeter.accessor('serialNumber', { header: 'Seri No' }),
    {
      header: 'Okumalar',
      cell: ({ row }: any) => (
        <Button size="sm" variant="outline-primary" onClick={() => fetchReadings(row.original)}>
          <Icon icon="chart-line" className="me-1" /> Okumalar
        </Button>
      ),
    },
    {
      header: 'İşlem',
      cell: ({ row }: any) => (
        <div className="d-flex gap-1">
          <Button size="sm" variant="light" className="btn-icon rounded-circle" onClick={() => { setSelectedMeter(row.original); setShowReadingModal(true) }}>
            <Icon icon="plus" className="fs-lg" />
          </Button>
          <Button size="sm" variant="light" className="btn-icon rounded-circle" onClick={() => { setSelectedRowIds({ [row.id]: true }); setShowDeleteModal(true) }}>
            <Icon icon="trash" className="fs-lg" />
          </Button>
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data: meters,
    columns: meterColumns,
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
      <PageBreadcrumb title="Sayaçlar" subtitle="Finans" />

      <div className="d-flex align-items-center justify-content-between mb-3">
        <BuildingSelect />
        <Button size="sm" variant="primary" className="d-inline-flex align-items-center gap-1" onClick={() => setShowMeterModal(true)} disabled={!selectedBuilding}>
          <Icon icon="plus" /> Sayaç Ekle
        </Button>
      </div>

      <Row>
        <Col xs={12} lg={selectedMeter ? 8 : 12}>
          <Card>
            <CardHeader className="border-light">
              <div className="app-search">
                <input type="search" className="form-control" placeholder="Sayaç ara..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} />
                <Icon icon="search" className="app-search-icon text-muted" />
              </div>
            </CardHeader>

            {loading ? (
              <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
            ) : (
              <DataTable<Meter> table={table} emptyMessage="Sayaç kaydı bulunamadı" />
            )}

            <CardFooter className="border-0 d-flex align-items-center justify-content-between gap-2">
              <FormSelect size="sm" style={{ width: 'auto' }} value={pagination.pageSize} onChange={(e) => table.setPageSize(Number(e.target.value))}>
                {[5, 10, 20].map((s) => <option key={s} value={s}>{s}</option>)}
              </FormSelect>
              {!loading && table.getRowModel().rows.length > 0 && (
                <TablePagination totalItems={totalItems} start={start} end={end} itemsName="sayaç" showInfo previousPage={table.previousPage} canPreviousPage={table.getCanPreviousPage()} pageCount={table.getPageCount()} pageIndex={table.getState().pagination.pageIndex} setPageIndex={table.setPageIndex} nextPage={table.nextPage} canNextPage={table.getCanNextPage()} />
              )}
            </CardFooter>
          </Card>
        </Col>

        {selectedMeter && (
          <Col xs={12} lg={4}>
            <Card>
              <CardHeader className="border-light justify-content-between">
                <h6 className="mb-0">
                  {METER_TYPES[selectedMeter.type]?.label} — Daire {selectedMeter.unitNumber}
                </h6>
                <div className="d-flex gap-2">
                  <Button size="sm" variant="primary" className="d-inline-flex align-items-center gap-1" onClick={() => setShowReadingModal(true)}>
                    <Icon icon="plus" /> Okuma Ekle
                  </Button>
                  <Button size="sm" variant="light" onClick={() => setSelectedMeter(null)}>
                    <Icon icon="x" />
                  </Button>
                </div>
              </CardHeader>
              <div className="p-0">
                {readings.length === 0 ? (
                  <div className="text-center py-4 text-muted fs-sm">Okuma kaydı yok</div>
                ) : (
                  <table className="table table-sm mb-0">
                    <thead><tr><th>Tarih</th><th>Değer</th><th>Tutar</th></tr></thead>
                    <tbody>
                      {readings.map((r) => (
                        <tr key={r.id}>
                          <td>{r.readingDate}</td>
                          <td>{r.value}</td>
                          <td>₺{r.amount.toLocaleString('tr-TR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>
          </Col>
        )}
      </Row>

      <Modal show={showMeterModal} onHide={() => setShowMeterModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Yeni Sayaç</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Daire</Form.Label>
              <Form.Select value={meterForm.unitId} onChange={(e) => setMeterForm({ ...meterForm, unitId: e.target.value })}>
                <option value="">Daire seçin...</option>
                {units.map((u) => <option key={u.id} value={u.id}>{u.number}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Sayaç Tipi</Form.Label>
              <Form.Select value={meterForm.type} onChange={(e) => setMeterForm({ ...meterForm, type: Number(e.target.value) })}>
                <option value={0}>Elektrik</option>
                <option value={1}>Doğalgaz</option>
                <option value={2}>Su</option>
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label>Seri No</Form.Label>
              <Form.Control value={meterForm.serialNumber} onChange={(e) => setMeterForm({ ...meterForm, serialNumber: e.target.value })} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowMeterModal(false)}>İptal</Button>
          <Button variant="primary" onClick={handleSaveMeter} disabled={saving || !meterForm.unitId || !meterForm.serialNumber}>
            {saving ? <Spinner size="sm" animation="border" /> : 'Kaydet'}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showReadingModal} onHide={() => setShowReadingModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Okuma Ekle</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Okuma Tarihi</Form.Label>
              <Form.Control type="date" value={readingForm.readingDate} onChange={(e) => setReadingForm({ ...readingForm, readingDate: e.target.value })} />
            </Form.Group>
            <Row className="g-3">
              <Col xs={6}>
                <Form.Group>
                  <Form.Label>Değer</Form.Label>
                  <Form.Control type="number" value={readingForm.value} onChange={(e) => setReadingForm({ ...readingForm, value: e.target.value })} />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group>
                  <Form.Label>Birim Fiyat (₺)</Form.Label>
                  <Form.Control type="number" value={readingForm.unitPrice} onChange={(e) => setReadingForm({ ...readingForm, unitPrice: e.target.value })} />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReadingModal(false)}>İptal</Button>
          <Button variant="primary" onClick={handleSaveReading} disabled={saving || !readingForm.readingDate || !readingForm.value}>
            {saving ? <Spinner size="sm" animation="border" /> : 'Kaydet'}
          </Button>
        </Modal.Footer>
      </Modal>

      <DeleteConfirmationModal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} onConfirm={handleDelete} selectedCount={Object.keys(selectedRowIds).length} itemName="sayaç" />
    </>
  )
}

export default SayaclarPage
