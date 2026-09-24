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

type Resident = { id: string; fullName: string; email: string; phone?: string; buildingId?: string; unitIds: string[]; createdAt: string }
type Unit = { id: string; number: string }

const col = createColumnHelper<Resident>()

const authToken = () => sessionStorage.getItem('token')?.replace(/^"|"$/g, '') ?? ''

const authApi = axios.create({ baseURL: '/api/auth' })
authApi.interceptors.request.use((config) => {
  const token = authToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const SakinlerPage = () => {
  const { selectedBuilding } = useBuilding()
  const [data, setData] = useState<Resident[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(false)
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>({})
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Resident | null>(null)
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', unitId: '' })
  const [editForm, setEditForm] = useState({ fullName: '', phone: '' })
  const [addUnitId, setAddUnitId] = useState('')
  const [unitAdding, setUnitAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const fetchData = () => {
    if (!selectedBuilding) return
    setLoading(true)
    api.get<Unit[]>(`/buildings/${selectedBuilding.id}/units`)
      .then((r) => setUnits(r.data))
      .catch(() => setUnits([]))
    api.get<Resident[]>(`/buildings/${selectedBuilding.id}/residents`)
      .then((r) => setData(r.data))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [selectedBuilding?.id])

  const unitNumber = (unitId?: string) => units.find((u) => u.id === unitId)?.number

  const openAdd = () => {
    setForm({ fullName: '', email: '', phone: '', password: '', unitId: units[0]?.id ?? '' })
    setFormError(null)
    setShowAddModal(true)
  }

  const openEdit = (r: Resident) => {
    setEditTarget(r)
    setEditForm({ fullName: r.fullName, phone: r.phone ?? '' })
    setAddUnitId('')
    setShowEditModal(true)
  }

  const handleAdd = async () => {
    if (!selectedBuilding) return
    setSaving(true)
    setFormError(null)
    try {
      await authApi.post('/auth/register-sakin', {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone || null,
        password: form.password,
        buildingId: selectedBuilding.id,
        unitId: form.unitId,
      })
      setShowAddModal(false)
      fetchData()
    } catch (err: any) {
      const msg = err.response?.data?.message ?? err.response?.data ?? 'Kayıt başarısız'
      setFormError(typeof msg === 'string' ? msg : 'Kayıt başarısız')
    }
    setSaving(false)
  }

  const handleEditSave = async () => {
    if (!editTarget) return
    setSaving(true)
    try {
      await authApi.put(`/residents/${editTarget.id}`, {
        fullName: editForm.fullName,
        phone: editForm.phone || null,
      })
      setShowEditModal(false)
      fetchData()
    } catch {}
    setSaving(false)
  }

  const handleAddUnit = async () => {
    if (!editTarget || !addUnitId) return
    setUnitAdding(true)
    try {
      await authApi.post(`/residents/${editTarget.id}/units`, { unitId: addUnitId })
      setAddUnitId('')
      api.get<Resident[]>(`/buildings/${selectedBuilding?.id}/residents`)
        .then((r) => { setData(r.data); setEditTarget((prev) => r.data.find((x) => x.id === prev?.id) ?? prev) })
        .catch(() => {})
    } catch {}
    setUnitAdding(false)
  }

  const handleRemoveUnit = async (unitId: string) => {
    if (!editTarget) return
    try {
      await authApi.delete(`/residents/${editTarget.id}/units/${unitId}`)
      api.get<Resident[]>(`/buildings/${selectedBuilding?.id}/residents`)
        .then((r) => { setData(r.data); setEditTarget((prev) => r.data.find((x) => x.id === prev?.id) ?? prev) })
        .catch(() => {})
    } catch {}
  }

  const handleDelete = async () => {
    for (const id of Object.keys(selectedRowIds)) {
      const row = table.getRow(id)
      if (row) await authApi.delete(`/residents/${row.original.id}`).catch(() => {})
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
    col.accessor('fullName', {
      header: 'Ad Soyad',
      cell: ({ row }) => (
        <div className="d-flex align-items-center gap-2">
          <span className="avatar-sm bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold fs-sm">
            {row.original.fullName.charAt(0).toUpperCase()}
          </span>
          <span className="fw-medium">{row.original.fullName}</span>
        </div>
      ),
    }),
    col.accessor('email', { header: 'E-posta' }),
    col.accessor('phone', {
      header: 'Telefon',
      cell: ({ row }) => row.original.phone
        ? <a href={`tel:${row.original.phone}`} className="text-body">{row.original.phone}</a>
        : <span className="text-muted fs-xs">—</span>,
    }),
    {
      id: 'units',
      header: 'Daire',
      cell: ({ row }: any) => row.original.unitIds?.length > 0
        ? <div className="d-flex flex-wrap gap-1">{row.original.unitIds.map((uid: string) => <Badge key={uid} bg="light" text="dark">Daire {unitNumber(uid) ?? '—'}</Badge>)}</div>
        : <span className="text-muted fs-xs">Atanmamış</span>,
    },
    col.accessor('createdAt', {
      header: 'Kayıt Tarihi',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('tr-TR'),
    }),
    {
      header: 'İşlem',
      cell: ({ row }: any) => (
        <div className="d-flex gap-1">
          <Button size="sm" variant="light" className="btn-icon rounded-circle" title="Daire Değiştir" onClick={() => openEdit(row.original)}>
            <Icon icon="home-edit" className="fs-lg" />
          </Button>
          <Button size="sm" variant="light" className="btn-icon rounded-circle" title="Pasife Al" onClick={() => { setSelectedRowIds({ [row.id]: true }); setShowDeleteModal(true) }}>
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
      <PageBreadcrumb title="Daire Sakinleri" subtitle="Bina Yönetimi" />

      <div className="d-flex align-items-center justify-content-between mb-3">
        <BuildingSelect />
        <Button size="sm" variant="primary" className="d-inline-flex align-items-center gap-1" onClick={openAdd} disabled={!selectedBuilding || units.length === 0}>
          <Icon icon="user-plus" /> Sakin Ekle
        </Button>
      </div>

      <Row>
        <Col xs={12}>
          <Card>
            <CardHeader className="border-light">
              <div className="app-search">
                <input type="search" className="form-control" placeholder="Sakin ara..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} />
                <Icon icon="search" className="app-search-icon text-muted" />
              </div>
            </CardHeader>

            {loading ? (
              <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
            ) : (
              <DataTable<Resident> table={table} emptyMessage="Bu binada kayıtlı sakin bulunmuyor" />
            )}

            <CardFooter className="border-0 d-flex align-items-center justify-content-between gap-2">
              <FormSelect size="sm" style={{ width: 'auto' }} value={pagination.pageSize} onChange={(e) => table.setPageSize(Number(e.target.value))}>
                {[5, 10, 20].map((s) => <option key={s} value={s}>{s}</option>)}
              </FormSelect>
              {!loading && table.getRowModel().rows.length > 0 && (
                <TablePagination totalItems={totalItems} start={start} end={end} itemsName="sakin" showInfo previousPage={table.previousPage} canPreviousPage={table.getCanPreviousPage()} pageCount={table.getPageCount()} pageIndex={table.getState().pagination.pageIndex} setPageIndex={table.setPageIndex} nextPage={table.nextPage} canNextPage={table.getCanNextPage()} />
              )}
            </CardFooter>
          </Card>
        </Col>
      </Row>

      {/* Sakin Ekle Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Yeni Daire Sakini</Modal.Title></Modal.Header>
        <Modal.Body>
          {formError && <div className="alert alert-danger py-2 fs-sm">{formError}</div>}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Ad Soyad</Form.Label>
              <Form.Control value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Tam adı" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>E-posta</Form.Label>
              <Form.Control type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="ornek@mail.com" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Telefon <small className="text-muted">(isteğe bağlı)</small></Form.Label>
              <Form.Control type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="05XX XXX XX XX" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Şifre</Form.Label>
              <Form.Control type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="En az 6 karakter" />
            </Form.Group>
            <Form.Group>
              <Form.Label>Daire</Form.Label>
              <Form.Select value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })}>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>Daire {u.number} — {selectedBuilding?.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>İptal</Button>
          <Button variant="primary" onClick={handleAdd} disabled={saving || !form.fullName || !form.email || !form.password || !form.unitId}>
            {saving ? <Spinner size="sm" animation="border" /> : 'Kaydet'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Sakin Düzenle Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Sakin Düzenle</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="g-3">
              <Col xs={12}>
                <Form.Group>
                  <Form.Label>Ad Soyad</Form.Label>
                  <Form.Control value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group>
                  <Form.Label>E-posta</Form.Label>
                  <Form.Control value={editTarget?.email ?? ''} disabled />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group>
                  <Form.Label>Telefon <small className="text-muted">(isteğe bağlı)</small></Form.Label>
                  <Form.Control type="tel" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="05XX XXX XX XX" />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <div className="border rounded p-3 bg-light-subtle">
                  <div className="text-muted fs-xs fw-semibold text-uppercase mb-2">Atanmış Daireler</div>
                  {(editTarget?.unitIds?.length ?? 0) === 0 ? (
                    <p className="text-muted fs-xs mb-2">Henüz daire atanmadı.</p>
                  ) : (
                    <div className="d-flex flex-wrap gap-2 mb-3">
                      {editTarget?.unitIds.map((uid) => {
                        const num = unitNumber(uid)
                        return (
                          <span key={uid} className="badge bg-light text-dark d-flex align-items-center gap-1 fs-sm px-2 py-1">
                            Daire {num ?? '—'}
                            <button type="button" className="btn-close fs-xxs ms-1" onClick={() => handleRemoveUnit(uid)} />
                          </span>
                        )
                      })}
                    </div>
                  )}
                  <div className="d-flex gap-2">
                    <Form.Select size="sm" value={addUnitId} onChange={(e) => setAddUnitId(e.target.value)} className="flex-grow-1">
                      <option value="">— Daire ekle</option>
                      {units.filter((u) => !editTarget?.unitIds.includes(u.id)).map((u) => (
                        <option key={u.id} value={u.id}>Daire {u.number}</option>
                      ))}
                    </Form.Select>
                    <Button size="sm" variant="primary" onClick={handleAddUnit} disabled={!addUnitId || unitAdding}>
                      {unitAdding ? <Spinner size="sm" animation="border" /> : 'Ekle'}
                    </Button>
                  </div>
                </div>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>İptal</Button>
          <Button variant="primary" onClick={handleEditSave} disabled={saving || !editForm.fullName}>
            {saving ? <Spinner size="sm" animation="border" /> : 'Kaydet'}
          </Button>
        </Modal.Footer>
      </Modal>

      <DeleteConfirmationModal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} onConfirm={handleDelete} selectedCount={Object.keys(selectedRowIds).length} itemName="sakin" />
    </>
  )
}

export default SakinlerPage
