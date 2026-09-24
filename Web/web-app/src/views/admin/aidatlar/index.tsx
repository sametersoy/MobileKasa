import PageBreadcrumb from '@/components/PageBreadcrumb'
import BuildingSelect from '@/components/BuildingSelect'
import Icon from '@/components/wrappers/Icon'
import api from '@/lib/api'
import { useBuilding } from '@/context/BuildingContext'
import DataTable from '@/components/table/DataTable'
import TablePagination from '@/components/table/TablePagination'
import { createColumnHelper, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type SortingState, type ColumnFiltersState } from '@tanstack/react-table'
import { useEffect, useState } from 'react'
import { Badge, Button, Card, CardBody, CardFooter, CardHeader, Col, Form, FormSelect, Modal, Nav, Row, Spinner, Tab } from 'react-bootstrap'

type DuesRule = { id: string; name: string; calculationType: number; amount: number; dayOfMonth: number; isActive: boolean }
type Due = { id: string; unitId: string; unitNumber: string; period: string; amount: number; dueDate: string; paidDate?: string; isPaid: boolean; note?: string }

const colRule = createColumnHelper<DuesRule>()
const colDue = createColumnHelper<Due>()

const fmt = (n: number) => '₺' + n.toLocaleString('tr-TR')

const AidatlarPage = () => {
  const { selectedBuilding } = useBuilding()
  const [rules, setRules] = useState<DuesRule[]>([])
  const [dues, setDues] = useState<Due[]>([])
  const [loading, setLoading] = useState(false)
  const [globalFilter, setGlobalFilter] = useState('')
  const [periodFilter, setPeriodFilter] = useState('')
  const [paidFilter, setPaidFilter] = useState<'' | 'true' | 'false'>('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [showRuleModal, setShowRuleModal] = useState(false)
  const [showGenModal, setShowGenModal] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)
  const [payTarget, setPayTarget] = useState<Due | null>(null)
  const [payForm, setPayForm] = useState({ paidDate: '', note: '' })
  const [ruleForm, setRuleForm] = useState({ name: '', calculationType: 0, amount: '', dayOfMonth: 1 })
  const [genForm, setGenForm] = useState({ period: '', dueDate: '' })
  const [saving, setSaving] = useState(false)

  const fetchData = () => {
    if (!selectedBuilding) return
    setLoading(true)
    const params = new URLSearchParams()
    if (periodFilter) params.set('period', periodFilter)
    if (paidFilter) params.set('isPaid', paidFilter)
    const query = params.toString() ? `?${params}` : ''
    api.get<DuesRule[]>(`/buildings/${selectedBuilding.id}/dues/rules`)
      .then((r) => setRules(r.data))
      .catch(() => setRules([]))
    api.get<Due[]>(`/buildings/${selectedBuilding.id}/dues${query}`)
      .then((r) => setDues(r.data))
      .catch(() => setDues([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [selectedBuilding?.id, periodFilter, paidFilter])

  const handleSaveRule = async () => {
    if (!selectedBuilding) return
    setSaving(true)
    try {
      await api.post(`/buildings/${selectedBuilding.id}/dues/rules`, { ...ruleForm, amount: Number(ruleForm.amount) })
      setShowRuleModal(false)
      setRuleForm({ name: '', calculationType: 0, amount: '', dayOfMonth: 1 })
      fetchData()
    } catch {}
    setSaving(false)
  }

  const handleDeleteRule = async (ruleId: string) => {
    if (!selectedBuilding) return
    await api.delete(`/buildings/${selectedBuilding.id}/dues/rules/${ruleId}`).catch(() => {})
    fetchData()
  }

  const handleGenerate = async () => {
    if (!selectedBuilding) return
    setSaving(true)
    try {
      await api.post(`/buildings/${selectedBuilding.id}/dues/generate`, genForm)
      setShowGenModal(false)
      setGenForm({ period: '', dueDate: '' })
      fetchData()
    } catch {}
    setSaving(false)
  }

  const openPay = (due: Due) => {
    setPayTarget(due)
    setPayForm({ paidDate: new Date().toISOString().split('T')[0], note: '' })
    setShowPayModal(true)
  }

  const handlePay = async () => {
    if (!selectedBuilding || !payTarget) return
    setSaving(true)
    try {
      await api.patch(`/buildings/${selectedBuilding.id}/dues/${payTarget.id}/pay`, payForm)
      setShowPayModal(false)
      fetchData()
    } catch {}
    setSaving(false)
  }

  const handleUnpay = async (due: Due) => {
    if (!selectedBuilding) return
    await api.patch(`/buildings/${selectedBuilding.id}/dues/${due.id}/unpay`, {}).catch(() => {})
    fetchData()
  }

  const periods = [...new Set(dues.map((d) => d.period))].sort().reverse()

  const dueColumns = [
    colDue.accessor('unitNumber', { header: 'Daire' }),
    colDue.accessor('period', { header: 'Dönem' }),
    colDue.accessor('amount', { header: 'Tutar', cell: ({ row }) => fmt(row.original.amount) }),
    colDue.accessor('dueDate', { header: 'Son Ödeme' }),
    colDue.accessor('isPaid', {
      header: 'Durum',
      cell: ({ row }) => <Badge bg={row.original.isPaid ? 'success' : 'danger'}>{row.original.isPaid ? 'Ödendi' : 'Bekliyor'}</Badge>,
    }),
    colDue.accessor('paidDate', {
      header: 'Ödeme Tarihi',
      cell: ({ row }) => row.original.paidDate
        ? <span title={row.original.note ?? ''}>{row.original.paidDate}</span>
        : <span className="text-muted">—</span>,
    }),
    {
      header: 'İşlem',
      cell: ({ row }: any) => row.original.isPaid ? (
        <Button size="sm" variant="outline-secondary" onClick={() => handleUnpay(row.original)}>
          <Icon icon="rotate-left" className="fs-sm me-1" /> Geri Al
        </Button>
      ) : (
        <Button size="sm" variant="success" onClick={() => openPay(row.original)}>
          <Icon icon="check" className="fs-sm me-1" /> Öde
        </Button>
      ),
    },
  ]

  const ruleColumns = [
    colRule.accessor('name', { header: 'Kural Adı' }),
    colRule.accessor('calculationType', { header: 'Hesaplama', cell: ({ row }) => row.original.calculationType === 0 ? 'Sabit / Daire' : 'M² Başına' }),
    colRule.accessor('amount', { header: 'Miktar', cell: ({ row }) => fmt(row.original.amount) }),
    colRule.accessor('dayOfMonth', { header: 'Ay Günü' }),
    colRule.accessor('isActive', {
      header: 'Aktif',
      cell: ({ row }) => <Badge bg={row.original.isActive ? 'success' : 'secondary'}>{row.original.isActive ? 'Aktif' : 'Pasif'}</Badge>,
    }),
    {
      header: 'İşlem',
      cell: ({ row }: any) => (
        <Button size="sm" variant="light" className="btn-icon rounded-circle text-danger" onClick={() => handleDeleteRule(row.original.id)}>
          <Icon icon="trash" className="fs-lg" />
        </Button>
      ),
    },
  ]

  const dueTable = useReactTable({
    data: dues,
    columns: dueColumns,
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

  const ruleTable = useReactTable({ data: rules, columns: ruleColumns, getCoreRowModel: getCoreRowModel() })

  const totalItems = dueTable.getFilteredRowModel().rows.length
  const start = pagination.pageIndex * pagination.pageSize + 1
  const end = Math.min(start + pagination.pageSize - 1, totalItems)

  const unpaidCount = dues.filter((d) => !d.isPaid).length
  const paidCount = dues.filter((d) => d.isPaid).length
  const totalPaid = dues.filter((d) => d.isPaid).reduce((s, d) => s + d.amount, 0)
  const totalPending = dues.filter((d) => !d.isPaid).reduce((s, d) => s + d.amount, 0)

  return (
    <>
      <PageBreadcrumb title="Aidatlar" subtitle="Finans" />

      <div className="d-flex align-items-center justify-content-between mb-3">
        <BuildingSelect />
        <div className="d-flex gap-2">
          <Button size="sm" variant="outline-primary" className="d-inline-flex align-items-center gap-1" onClick={() => setShowGenModal(true)} disabled={!selectedBuilding}>
            <Icon icon="refresh" /> Aidat Oluştur
          </Button>
          <Button size="sm" variant="primary" className="d-inline-flex align-items-center gap-1" onClick={() => setShowRuleModal(true)} disabled={!selectedBuilding}>
            <Icon icon="plus" /> Kural Ekle
          </Button>
        </div>
      </div>

      <Tab.Container defaultActiveKey="dues">
        <Row>
          <Col xs={12}>
            <Card>
              <CardHeader className="border-light">
                <Nav variant="tabs" className="border-0">
                  <Nav.Item><Nav.Link eventKey="dues">Aidat Listesi</Nav.Link></Nav.Item>
                  <Nav.Item><Nav.Link eventKey="rules">Kurallar</Nav.Link></Nav.Item>
                </Nav>
              </CardHeader>

              {dues.length > 0 && (
                <CardBody className="py-2 border-bottom">
                  <div className="d-flex gap-4 flex-wrap fs-sm">
                    <span className="text-success"><strong>{fmt(totalPaid)}</strong> tahsil edildi ({paidCount} aidat)</span>
                    <span className="text-danger"><strong>{fmt(totalPending)}</strong> bekliyor ({unpaidCount} aidat)</span>
                  </div>
                </CardBody>
              )}

              <CardBody className="pb-0">
                <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
                  <div className="app-search">
                    <input type="search" className="form-control" placeholder="Ara..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} />
                    <Icon icon="search" className="app-search-icon text-muted" />
                  </div>
                  <FormSelect size="sm" style={{ width: 130 }} value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)}>
                    <option value="">Tüm dönemler</option>
                    {periods.map((p) => <option key={p} value={p}>{p}</option>)}
                  </FormSelect>
                  <FormSelect size="sm" style={{ width: 130 }} value={paidFilter} onChange={(e) => setPaidFilter(e.target.value as any)}>
                    <option value="">Tümü</option>
                    <option value="false">Bekleyenler</option>
                    <option value="true">Ödenenler</option>
                  </FormSelect>
                  <FormSelect size="sm" style={{ width: 80 }} value={pagination.pageSize} onChange={(e) => dueTable.setPageSize(Number(e.target.value))}>
                    {[5, 10, 20].map((s) => <option key={s} value={s}>{s}</option>)}
                  </FormSelect>
                </div>
              </CardBody>

              {loading ? (
                <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
              ) : (
                <Tab.Content>
                  <Tab.Pane eventKey="dues">
                    <DataTable<Due> table={dueTable} emptyMessage="Aidat kaydı bulunamadı" />
                    {dueTable.getRowModel().rows.length > 0 && (
                      <CardFooter className="border-0">
                        <TablePagination totalItems={totalItems} start={start} end={end} itemsName="aidat" showInfo previousPage={dueTable.previousPage} canPreviousPage={dueTable.getCanPreviousPage()} pageCount={dueTable.getPageCount()} pageIndex={dueTable.getState().pagination.pageIndex} setPageIndex={dueTable.setPageIndex} nextPage={dueTable.nextPage} canNextPage={dueTable.getCanNextPage()} />
                      </CardFooter>
                    )}
                  </Tab.Pane>
                  <Tab.Pane eventKey="rules">
                    <DataTable<DuesRule> table={ruleTable} emptyMessage="Kural tanımlanmamış" />
                  </Tab.Pane>
                </Tab.Content>
              )}
            </Card>
          </Col>
        </Row>
      </Tab.Container>

      {/* Ödeme Modalı */}
      <Modal show={showPayModal} onHide={() => setShowPayModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Ödeme Al — Daire {payTarget?.unitNumber} / {payTarget?.period}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="alert alert-info py-2 fs-sm mb-3">
            Tutar: <strong>{fmt(payTarget?.amount ?? 0)}</strong>
          </div>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Ödeme Tarihi</Form.Label>
              <Form.Control type="date" value={payForm.paidDate} onChange={(e) => setPayForm({ ...payForm, paidDate: e.target.value })} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Not <small className="text-muted">(isteğe bağlı)</small></Form.Label>
              <Form.Control value={payForm.note} onChange={(e) => setPayForm({ ...payForm, note: e.target.value })} placeholder="Nakit, havale vb." />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPayModal(false)}>İptal</Button>
          <Button variant="success" onClick={handlePay} disabled={saving || !payForm.paidDate}>
            {saving ? <Spinner size="sm" animation="border" /> : 'Ödemeyi Kaydet'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Kural Ekle Modalı */}
      <Modal show={showRuleModal} onHide={() => setShowRuleModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Yeni Aidat Kuralı</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Kural Adı</Form.Label>
              <Form.Control value={ruleForm.name} onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })} placeholder="Aylık Aidat" />
            </Form.Group>
            <Row className="g-3">
              <Col xs={6}>
                <Form.Group>
                  <Form.Label>Hesaplama</Form.Label>
                  <Form.Select value={ruleForm.calculationType} onChange={(e) => setRuleForm({ ...ruleForm, calculationType: Number(e.target.value) })}>
                    <option value={0}>Sabit / Daire</option>
                    <option value={1}>M² Başına</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group>
                  <Form.Label>Miktar (₺)</Form.Label>
                  <Form.Control type="number" value={ruleForm.amount} onChange={(e) => setRuleForm({ ...ruleForm, amount: e.target.value })} />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group>
                  <Form.Label>Ay Günü</Form.Label>
                  <Form.Control type="number" min={1} max={31} value={ruleForm.dayOfMonth} onChange={(e) => setRuleForm({ ...ruleForm, dayOfMonth: Number(e.target.value) })} />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRuleModal(false)}>İptal</Button>
          <Button variant="primary" onClick={handleSaveRule} disabled={saving || !ruleForm.name || !ruleForm.amount}>
            {saving ? <Spinner size="sm" animation="border" /> : 'Kaydet'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Aidat Oluştur Modalı */}
      <Modal show={showGenModal} onHide={() => setShowGenModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Aidat Oluştur</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Dönem (Örn: 2026-05)</Form.Label>
              <Form.Control value={genForm.period} onChange={(e) => setGenForm({ ...genForm, period: e.target.value })} placeholder="2026-05" />
            </Form.Group>
            <Form.Group>
              <Form.Label>Son Ödeme Tarihi</Form.Label>
              <Form.Control type="date" value={genForm.dueDate} onChange={(e) => setGenForm({ ...genForm, dueDate: e.target.value })} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowGenModal(false)}>İptal</Button>
          <Button variant="primary" onClick={handleGenerate} disabled={saving || !genForm.period || !genForm.dueDate}>
            {saving ? <Spinner size="sm" animation="border" /> : 'Oluştur'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default AidatlarPage
