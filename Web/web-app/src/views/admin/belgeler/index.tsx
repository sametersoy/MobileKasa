import PageBreadcrumb from '@/components/PageBreadcrumb'
import BuildingSelect from '@/components/BuildingSelect'
import Icon from '@/components/wrappers/Icon'
import api from '@/lib/api'
import { useBuilding } from '@/context/BuildingContext'
import DataTable from '@/components/table/DataTable'
import TablePagination from '@/components/table/TablePagination'
import DeleteConfirmationModal from '@/components/table/DeleteConfirmationModal'
import { createColumnHelper, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type SortingState, type ColumnFiltersState } from '@tanstack/react-table'
import { useEffect, useRef, useState } from 'react'
import { Badge, Button, Card, CardFooter, CardHeader, Col, Form, FormSelect, Modal, Row, Spinner } from 'react-bootstrap'

type Document = { id: string; buildingId: string; unitId?: string; name: string; fileName: string; contentType: string; fileSizeBytes: number; category: number; uploadedAt: string }

const CATEGORIES = ['Genel', 'Sözleşme', 'Fatura', 'Toplantı', 'Hukuki']
const CAT_COLORS = ['secondary', 'info', 'warning', 'primary', 'danger']

const col = createColumnHelper<Document>()

const BelgelerPage = () => {
  const { selectedBuilding } = useBuilding()
  const [data, setData] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>({})
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadForm, setUploadForm] = useState({ name: '', category: 0, unitId: '' })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchData = () => {
    if (!selectedBuilding) return
    setLoading(true)
    api.get<Document[]>(`/buildings/${selectedBuilding.id}/documents`)
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [selectedBuilding?.id])

  const handleDownload = async (doc: Document) => {
    if (!selectedBuilding) return
    const token = sessionStorage.getItem('token')?.replace(/^"|"$/g, '')
    const url = `/api/web/buildings/${selectedBuilding.id}/documents/${doc.id}/download`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    const blob = await res.blob()
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = doc.fileName
    link.click()
  }

  const handleUpload = async () => {
    if (!selectedBuilding || !selectedFile) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', selectedFile)
      fd.append('name', uploadForm.name || selectedFile.name)
      fd.append('category', String(uploadForm.category))
      if (uploadForm.unitId) fd.append('unitId', uploadForm.unitId)
      await api.post(`/buildings/${selectedBuilding.id}/documents`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setShowUploadModal(false)
      setUploadForm({ name: '', category: 0, unitId: '' })
      setSelectedFile(null)
      fetchData()
    } catch {}
    setUploading(false)
  }

  const handleDelete = async () => {
    if (!selectedBuilding) return
    for (const id of Object.keys(selectedRowIds)) {
      const row = table.getRow(id)
      if (row) await api.delete(`/buildings/${selectedBuilding.id}/documents/${row.original.id}`).catch(() => {})
    }
    setSelectedRowIds({})
    setShowDeleteModal(false)
    fetchData()
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const columns = [
    {
      id: 'select',
      header: ({ table: t }: any) => <input type="checkbox" className="form-check-input form-check-input-light fs-14" checked={t.getIsAllRowsSelected()} onChange={t.getToggleAllRowsSelectedHandler()} />,
      cell: ({ row }: any) => <input type="checkbox" className="form-check-input form-check-input-light fs-14" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />,
      enableSorting: false,
    },
    col.accessor('name', {
      header: 'Belge Adı',
      cell: ({ row }) => (
        <div className="d-flex align-items-center gap-2">
          <Icon icon="file-description" className="text-muted" />
          <span>{row.original.name}</span>
        </div>
      ),
    }),
    col.accessor('category', {
      header: 'Kategori',
      cell: ({ row }) => <Badge bg={CAT_COLORS[row.original.category] ?? 'secondary'}>{CATEGORIES[row.original.category] ?? row.original.category}</Badge>,
    }),
    col.accessor('fileSizeBytes', { header: 'Boyut', cell: ({ row }) => formatSize(row.original.fileSizeBytes) }),
    col.accessor('uploadedAt', {
      header: 'Yükleme Tarihi',
      cell: ({ row }) => new Date(row.original.uploadedAt).toLocaleDateString('tr-TR'),
    }),
    {
      header: 'İşlem',
      cell: ({ row }: any) => (
        <div className="d-flex gap-1">
          <Button size="sm" variant="light" className="btn-icon rounded-circle" onClick={() => handleDownload(row.original)}>
            <Icon icon="download" className="fs-lg" />
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
      <PageBreadcrumb title="Belgeler" subtitle="Bina Yönetimi" />

      <div className="d-flex align-items-center justify-content-between mb-3">
        <BuildingSelect />
        <Button size="sm" variant="primary" className="d-inline-flex align-items-center gap-1" onClick={() => setShowUploadModal(true)} disabled={!selectedBuilding}>
          <Icon icon="upload" /> Belge Yükle
        </Button>
      </div>

      <Row>
        <Col xs={12}>
          <Card>
            <CardHeader className="border-light">
              <div className="app-search">
                <input type="search" className="form-control" placeholder="Belge ara..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} />
                <Icon icon="search" className="app-search-icon text-muted" />
              </div>
            </CardHeader>

            {loading ? (
              <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
            ) : (
              <DataTable<Document> table={table} emptyMessage="Belge bulunamadı" />
            )}

            <CardFooter className="border-0 d-flex align-items-center justify-content-between gap-2">
              <FormSelect size="sm" style={{ width: 'auto' }} value={pagination.pageSize} onChange={(e) => table.setPageSize(Number(e.target.value))}>
                {[5, 10, 20].map((s) => <option key={s} value={s}>{s}</option>)}
              </FormSelect>
              {!loading && table.getRowModel().rows.length > 0 && (
                <TablePagination totalItems={totalItems} start={start} end={end} itemsName="belge" showInfo previousPage={table.previousPage} canPreviousPage={table.getCanPreviousPage()} pageCount={table.getPageCount()} pageIndex={table.getState().pagination.pageIndex} setPageIndex={table.setPageIndex} nextPage={table.nextPage} canNextPage={table.getCanNextPage()} />
              )}
            </CardFooter>
          </Card>
        </Col>
      </Row>

      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Belge Yükle</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Dosya</Form.Label>
              <Form.Control type="file" ref={fileRef} onChange={(e) => setSelectedFile((e.target as HTMLInputElement).files?.[0] ?? null)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Belge Adı <small className="text-muted">(boş = dosya adı)</small></Form.Label>
              <Form.Control value={uploadForm.name} onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })} placeholder="İsteğe bağlı" />
            </Form.Group>
            <Form.Group>
              <Form.Label>Kategori</Form.Label>
              <Form.Select value={uploadForm.category} onChange={(e) => setUploadForm({ ...uploadForm, category: Number(e.target.value) })}>
                {CATEGORIES.map((c, i) => <option key={i} value={i}>{c}</option>)}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUploadModal(false)}>İptal</Button>
          <Button variant="primary" onClick={handleUpload} disabled={uploading || !selectedFile}>
            {uploading ? <Spinner size="sm" animation="border" /> : 'Yükle'}
          </Button>
        </Modal.Footer>
      </Modal>

      <DeleteConfirmationModal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} onConfirm={handleDelete} selectedCount={Object.keys(selectedRowIds).length} itemName="belge" />
    </>
  )
}

export default BelgelerPage
