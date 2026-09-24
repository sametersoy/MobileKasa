import PageBreadcrumb from '@/components/PageBreadcrumb'
import BuildingSelect from '@/components/BuildingSelect'
import Icon from '@/components/wrappers/Icon'
import api from '@/lib/api'
import axios from 'axios'
import { useBuilding } from '@/context/BuildingContext'
import DataTable from '@/components/table/DataTable'
import TablePagination from '@/components/table/TablePagination'
import DeleteConfirmationModal from '@/components/table/DeleteConfirmationModal'
import { createColumnHelper, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type SortingState, type ColumnFiltersState } from '@tanstack/react-table'
import { useEffect, useState } from 'react'
import { Badge, Button, Card, CardFooter, CardHeader, Col, Form, FormSelect, Modal, Row, Spinner } from 'react-bootstrap'

const authApi = axios.create({ baseURL: '/api/auth' })
authApi.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token')?.replace(/^"|"$/g, '') ?? ''
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

type Unit = { id: string; buildingId: string; number: string; floor: number; type: number; areaM2: number; isOccupied: boolean }
type Resident = { id: string; fullName: string; email: string; phone?: string; unitIds: string[] }
type Due = { id: string; unitId: string; period: string; amount: number; dueDate: string; paidDate?: string; isPaid: boolean; note?: string }

const fmt = (n: number) => '₺' + n.toLocaleString('tr-TR')

const UNIT_TYPES = ['Konut', 'İşyeri', 'Otopark']
const UNIT_TYPE_COLORS: Record<number, string> = { 0: 'primary', 1: 'warning', 2: 'secondary' }

const columnHelper = createColumnHelper<Unit>()

const DairelerPage = () => {
  const { selectedBuilding } = useBuilding()
  const [data, setData] = useState<Unit[]>([])
  const [residents, setResidents] = useState<Resident[]>([])
  const [loading, setLoading] = useState(false)
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>({})
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Unit | null>(null)
  const [form, setForm] = useState({ number: '', floor: 0, type: 0, areaM2: 0, isOccupied: false })
  const [saving, setSaving] = useState(false)
  const [showResidentModal, setShowResidentModal] = useState(false)
  const [residentForm, setResidentForm] = useState({ fullName: '', email: '', phone: '', password: '' })
  const [residentSaving, setResidentSaving] = useState(false)
  const [residentError, setResidentError] = useState('')
  const [assignId, setAssignId] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [dues, setDues] = useState<Due[]>([])
  const [showPayModal, setShowPayModal] = useState(false)
  const [payTarget, setPayTarget] = useState<Due | null>(null)
  const [payForm, setPayForm] = useState({ paidDate: '', note: '' })
  const [paying, setPaying] = useState(false)

  const fetchData = () => {
    if (!selectedBuilding) return
    setLoading(true)
    api.get<Unit[]>(`/buildings/${selectedBuilding.id}/units`)
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
    api.get<Resident[]>(`/buildings/${selectedBuilding.id}/residents`)
      .then((r) => setResidents(r.data))
      .catch(() => setResidents([]))
    api.get<Due[]>(`/buildings/${selectedBuilding.id}/dues`)
      .then((r) => setDues(r.data))
      .catch(() => setDues([]))
  }

  const residentsForUnit = (unitId: string) => residents.filter((r) => r.unitIds?.includes(unitId))
  const duesForUnit = (unitId: string) => dues.filter((d) => d.unitId === unitId).sort((a, b) => b.period.localeCompare(a.period))
  const latestDue = (unitId: string) => duesForUnit(unitId)[0] ?? null

  const openPay = (due: Due) => {
    setPayTarget(due)
    setPayForm({ paidDate: new Date().toISOString().split('T')[0], note: '' })
    setShowPayModal(true)
  }

  const handlePay = async () => {
    if (!selectedBuilding || !payTarget) return
    setPaying(true)
    try {
      await api.patch(`/buildings/${selectedBuilding.id}/dues/${payTarget.id}/pay`, payForm)
      setShowPayModal(false)
      api.get<Due[]>(`/buildings/${selectedBuilding.id}/dues`)
        .then((r) => setDues(r.data)).catch(() => {})
    } catch {}
    setPaying(false)
  }

  const handleUnpay = async (due: Due) => {
    if (!selectedBuilding) return
    await api.patch(`/buildings/${selectedBuilding.id}/dues/${due.id}/unpay`, {}).catch(() => {})
    api.get<Due[]>(`/buildings/${selectedBuilding.id}/dues`)
      .then((r) => setDues(r.data)).catch(() => {})
  }

  const handleAddResident = async () => {
    if (!selectedBuilding || !editTarget) return
    setResidentSaving(true)
    setResidentError('')
    try {
      await authApi.post('/auth/register-sakin', {
        fullName: residentForm.fullName,
        email: residentForm.email,
        phone: residentForm.phone || null,
        password: residentForm.password,
        buildingId: selectedBuilding.id,
        unitId: editTarget.id,
      })
      api.get<Resident[]>(`/buildings/${selectedBuilding.id}/residents`)
        .then((r) => setResidents(r.data))
        .catch(() => {})
      setShowResidentModal(false)
    } catch (e: any) {
      setResidentError(e?.response?.data?.message ?? 'Sakin eklenirken hata oluştu.')
    }
    setResidentSaving(false)
  }

  const handleAssign = async () => {
    if (!selectedBuilding || !editTarget || !assignId) return
    setAssigning(true)
    try {
      await authApi.post(`/residents/${assignId}/units`, { unitId: editTarget.id })
      api.get<Resident[]>(`/buildings/${selectedBuilding.id}/residents`)
        .then((r) => setResidents(r.data))
        .catch(() => {})
      setAssignId('')
    } catch {}
    setAssigning(false)
  }

  const handleUnassign = async (residentId: string) => {
    if (!selectedBuilding || !editTarget) return
    try {
      await authApi.delete(`/residents/${residentId}/units/${editTarget.id}`)
      api.get<Resident[]>(`/buildings/${selectedBuilding.id}/residents`)
        .then((r) => setResidents(r.data))
        .catch(() => {})
    } catch {}
  }

  useEffect(() => { fetchData() }, [selectedBuilding?.id])

  const openAdd = () => {
    setEditTarget(null)
    setForm({ number: '', floor: 0, type: 0, areaM2: 0, isOccupied: false })
    setShowFormModal(true)
  }

  const openEdit = (u: Unit) => {
    setEditTarget(u)
    setForm({ number: u.number, floor: u.floor, type: u.type, areaM2: u.areaM2, isOccupied: u.isOccupied })
    setShowFormModal(true)
  }

  const handleSave = async () => {
    if (!selectedBuilding) return
    setSaving(true)
    try {
      if (editTarget) {
        await api.put(`/buildings/${selectedBuilding.id}/units/${editTarget.id}`, form)
        setShowFormModal(false)
      } else {
        const res = await api.post<Unit>(`/buildings/${selectedBuilding.id}/units`, form)
        setEditTarget(res.data)
        setForm({ number: res.data.number, floor: res.data.floor, type: res.data.type, areaM2: res.data.areaM2, isOccupied: res.data.isOccupied })
      }
      fetchData()
    } catch {}
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!selectedBuilding) return
    for (const id of Object.keys(selectedRowIds)) {
      const row = table.getRow(id)
      if (row) await api.delete(`/buildings/${selectedBuilding.id}/units/${row.original.id}`).catch(() => {})
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
    columnHelper.accessor('number', { header: 'Daire No' }),
    columnHelper.accessor('floor', { header: 'Kat' }),
    columnHelper.accessor('type', {
      header: 'Tip',
      cell: ({ row }) => <Badge bg={UNIT_TYPE_COLORS[row.original.type] ?? 'info'}>{UNIT_TYPES[row.original.type] ?? row.original.type}</Badge>,
    }),
    {
      id: 'resident',
      header: 'Kayıtlı Sakin',
      cell: ({ row }: any) => {
        const rs = residentsForUnit(row.original.id)
        return rs.length > 0
          ? (
            <div>
              {rs.map((r) => (
                <div key={r.id} className="mb-1 last-mb-0">
                  <div className="fw-medium fs-sm">{r.fullName}</div>
                  {r.phone && <div className="text-muted fs-xs">{r.phone}</div>}
                </div>
              ))}
            </div>
          )
          : <span className="text-muted fs-xs">—</span>
      },
    },
    {
      id: 'dues',
      header: 'Son Aidat',
      cell: ({ row }: any) => {
        const d = latestDue(row.original.id)
        if (!d) return <span className="text-muted fs-xs">—</span>
        return (
          <div>
            <Badge bg={d.isPaid ? 'success' : 'danger'} className="me-1">{d.isPaid ? 'Ödendi' : 'Bekliyor'}</Badge>
            <span className="fs-xs text-muted">{d.period} · {fmt(d.amount)}</span>
          </div>
        )
      },
    },
    columnHelper.accessor('areaM2', { header: 'Alan (m²)' }),
    columnHelper.accessor('isOccupied', {
      header: 'Durumu',
      cell: ({ row }) => <Badge bg={row.original.isOccupied ? 'success' : 'secondary'}>{row.original.isOccupied ? 'Dolu' : 'Boş'}</Badge>,
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
      <PageBreadcrumb title="Daireler" subtitle="Bina Yönetimi" />

      <div className="d-flex align-items-center justify-content-between mb-3">
        <BuildingSelect />
        <Button size="sm" variant="primary" className="d-inline-flex align-items-center gap-1" onClick={openAdd} disabled={!selectedBuilding}>
          <Icon icon="plus" /> Daire Ekle
        </Button>
      </div>

      <Row>
        <Col xs={12}>
          <Card>
            <CardHeader className="border-light">
              <div className="app-search">
                <input type="search" className="form-control" placeholder="Daire ara..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} />
                <Icon icon="search" className="app-search-icon text-muted" />
              </div>
            </CardHeader>

            {loading ? (
              <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
            ) : (
              <DataTable<Unit> table={table} emptyMessage="Bu binada daire bulunmuyor" />
            )}

            <CardFooter className="border-0 d-flex align-items-center justify-content-between gap-2">
              <FormSelect size="sm" style={{ width: 'auto' }} value={pagination.pageSize} onChange={(e) => table.setPageSize(Number(e.target.value))}>
                {[5, 10, 20].map((s) => <option key={s} value={s}>{s}</option>)}
              </FormSelect>
              {!loading && table.getRowModel().rows.length > 0 && (
                <TablePagination totalItems={totalItems} start={start} end={end} itemsName="daire" showInfo previousPage={table.previousPage} canPreviousPage={table.getCanPreviousPage()} pageCount={table.getPageCount()} pageIndex={table.getState().pagination.pageIndex} setPageIndex={table.setPageIndex} nextPage={table.nextPage} canNextPage={table.getCanNextPage()} />
              )}
            </CardFooter>
          </Card>
        </Col>
      </Row>

      <Modal show={showFormModal} onHide={() => setShowFormModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editTarget ? `Daire ${editTarget.number} — Düzenle` : 'Yeni Daire'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="g-3">
              <Col xs={6}>
                <Form.Group>
                  <Form.Label>Daire No</Form.Label>
                  <Form.Control value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} placeholder="1A" />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group>
                  <Form.Label>Kat</Form.Label>
                  <Form.Control type="number" value={form.floor} onChange={(e) => setForm({ ...form, floor: Number(e.target.value) })} />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group>
                  <Form.Label>Tip</Form.Label>
                  <Form.Select value={form.type} onChange={(e) => setForm({ ...form, type: Number(e.target.value) })}>
                    <option value={0}>Konut</option>
                    <option value={1}>İşyeri</option>
                    <option value={2}>Otopark</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group>
                  <Form.Label>Alan (m²)</Form.Label>
                  <Form.Control type="number" value={form.areaM2} onChange={(e) => setForm({ ...form, areaM2: Number(e.target.value) })} />
                </Form.Group>
              </Col>
              {editTarget && (
                <Col xs={12}>
                  <Form.Check label="Dolu" checked={form.isOccupied} onChange={(e) => setForm({ ...form, isOccupied: e.target.checked })} />
                </Col>
              )}
              {editTarget && (() => {
                const rs = residentsForUnit(editTarget.id)
                const assignable = residents.filter((r) => !rs.find((x) => x.id === r.id))
                return (
                  <Col xs={12}>
                    <div className="border rounded p-3 bg-light-subtle">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-muted fs-xs fw-semibold text-uppercase">Kayıtlı Sakinler</span>
                        <Button
                          size="sm"
                          variant="outline-primary"
                          className="py-0 fs-xs"
                          onClick={() => { setResidentForm({ fullName: '', email: '', phone: '', password: '' }); setResidentError(''); setShowResidentModal(true) }}
                        >
                          <Icon icon="user-plus" className="fs-xs me-1" /> Yeni Sakin
                        </Button>
                      </div>
                      {rs.length === 0 ? (
                        <p className="text-muted fs-xs mb-2">Bu daireye atanmış sakin yok.</p>
                      ) : (
                        <div className="d-flex flex-column gap-2 mb-3">
                          {rs.map((r) => (
                            <div key={r.id} className="d-flex align-items-center gap-2">
                              <div className="avatar-sm flex-shrink-0">
                                <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-sm fw-bold">
                                  {r.fullName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="min-w-0 flex-grow-1">
                                <div className="fw-medium fs-sm">{r.fullName}</div>
                                <div className="text-muted fs-xs">{r.email}{r.phone && ` · ${r.phone}`}</div>
                              </div>
                              <button type="button" className="btn-close fs-xxs flex-shrink-0" title="Daireyle ilişkisini kaldır" onClick={() => handleUnassign(r.id)} />
                            </div>
                          ))}
                        </div>
                      )}
                      {assignable.length > 0 && (
                        <>
                          <div className="text-muted fs-xs fw-semibold text-uppercase mb-2">Mevcut Sakini Ata</div>
                          <div className="d-flex gap-2">
                            <Form.Select size="sm" value={assignId} onChange={(e) => setAssignId(e.target.value)} className="flex-grow-1">
                              <option value="">— Sakin seç</option>
                              {assignable.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.fullName}{r.unitIds?.length > 0 ? ' (başka dairede)' : ' (atanmamış)'}
                                </option>
                              ))}
                            </Form.Select>
                            <Button size="sm" variant="primary" onClick={handleAssign} disabled={!assignId || assigning}>
                              {assigning ? <Spinner size="sm" animation="border" /> : 'Ata'}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </Col>
                )
              })()}
              {editTarget && (() => {
                const unitDues = duesForUnit(editTarget.id)
                if (unitDues.length === 0) return null
                return (
                  <Col xs={12}>
                    <div className="border rounded p-3">
                      <div className="text-muted fs-xs fw-semibold text-uppercase mb-2">Aidat Durumu</div>
                      <div className="d-flex flex-column gap-2">
                        {unitDues.slice(0, 6).map((d) => (
                          <div key={d.id} className="d-flex align-items-center justify-content-between gap-2">
                            <div>
                              <span className="fw-medium fs-sm me-2">{d.period}</span>
                              <Badge bg={d.isPaid ? 'success' : 'danger'}>{d.isPaid ? 'Ödendi' : 'Bekliyor'}</Badge>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                              <span className="fw-medium fs-sm">{fmt(d.amount)}</span>
                              {d.isPaid ? (
                                <Button size="sm" variant="outline-secondary" className="py-0 fs-xs" onClick={() => handleUnpay(d)}>
                                  Geri Al
                                </Button>
                              ) : (
                                <Button size="sm" variant="outline-success" className="py-0 fs-xs" onClick={() => openPay(d)}>
                                  Öde
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Col>
                )
              })()}
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowFormModal(false)}>İptal</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || !form.number}>
            {saving ? <Spinner size="sm" animation="border" /> : 'Kaydet'}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showPayModal} onHide={() => setShowPayModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Ödeme Al — {payTarget?.period}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="alert alert-info py-2 fs-sm mb-3">Tutar: <strong>{fmt(payTarget?.amount ?? 0)}</strong></div>
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
          <Button variant="success" onClick={handlePay} disabled={paying || !payForm.paidDate}>
            {paying ? <Spinner size="sm" animation="border" /> : 'Ödemeyi Kaydet'}
          </Button>
        </Modal.Footer>
      </Modal>

      <DeleteConfirmationModal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} onConfirm={handleDelete} selectedCount={Object.keys(selectedRowIds).length} itemName="daire" />

      <Modal show={showResidentModal} onHide={() => setShowResidentModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Sakin Ekle</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="g-3">
              <Col xs={12}>
                <Form.Group>
                  <Form.Label>Ad Soyad</Form.Label>
                  <Form.Control value={residentForm.fullName} onChange={(e) => setResidentForm({ ...residentForm, fullName: e.target.value })} placeholder="Ad Soyad" />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group>
                  <Form.Label>E-posta</Form.Label>
                  <Form.Control type="email" value={residentForm.email} onChange={(e) => setResidentForm({ ...residentForm, email: e.target.value })} placeholder="ornek@mail.com" />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group>
                  <Form.Label>Telefon <span className="text-muted fs-xs">(isteğe bağlı)</span></Form.Label>
                  <Form.Control value={residentForm.phone} onChange={(e) => setResidentForm({ ...residentForm, phone: e.target.value })} placeholder="05xx xxx xx xx" />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group>
                  <Form.Label>Şifre</Form.Label>
                  <Form.Control type="password" value={residentForm.password} onChange={(e) => setResidentForm({ ...residentForm, password: e.target.value })} placeholder="En az 6 karakter" />
                </Form.Group>
              </Col>
              {residentError && (
                <Col xs={12}>
                  <div className="alert alert-danger py-2 mb-0 fs-sm">{residentError}</div>
                </Col>
              )}
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowResidentModal(false)}>İptal</Button>
          <Button variant="primary" onClick={handleAddResident} disabled={residentSaving || !residentForm.fullName || !residentForm.email || !residentForm.password}>
            {residentSaving ? <Spinner size="sm" animation="border" /> : 'Kaydet'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default DairelerPage
