import Icon from '@/components/wrappers/Icon'
import { ProductThumb } from '@/components/retail'
import { useStore } from '@/context/StoreContext'
import { fmt } from '@/lib/format'
import { retailApi, type Product } from '@/lib/retail'
import { forwardRef, useEffect, useRef, useState } from 'react'
import { Button, Form, InputGroup, ListGroup, Modal, Spinner } from 'react-bootstrap'

type BarcodeDetectorLike = { detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]> }
declare global {
  interface Window {
    BarcodeDetector?: new (opts?: { formats?: string[] }) => BarcodeDetectorLike
  }
}

const cameraSupported = () => typeof window !== 'undefined' && !!window.BarcodeDetector && !!navigator.mediaDevices?.getUserMedia

// Barkod alanı: USB okuyucu klavye gibi yazıp Enter'a basar. Kamera (destekleyen tarayıcılarda) ve katalog araması da buradan açılır.
const BarcodeInput = forwardRef<HTMLInputElement, { onBarcode: (code: string) => void; onPickProduct: (p: Product) => void; busy?: boolean; autoFocus?: boolean }>(
  ({ onBarcode, onPickProduct, busy, autoFocus = true }, ref) => {
    const [value, setValue] = useState('')
    const [cameraOpen, setCameraOpen] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)

    const submit = (code: string) => {
      const c = code.trim()
      if (!c) return
      setValue('')
      onBarcode(c)
    }

    return (
      <>
        <InputGroup size="lg">
          <InputGroup.Text className="bg-light">
            {busy ? <Spinner animation="border" size="sm" /> : <Icon icon="barcode" />}
          </InputGroup.Text>
          <Form.Control
            ref={ref}
            autoFocus={autoFocus}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                submit(value)
              }
            }}
            placeholder="Barkodu okutun veya yazıp Enter'a basın"
            inputMode="numeric"
            autoComplete="off"
          />
          {cameraSupported() && (
            <Button variant="outline-secondary" onClick={() => setCameraOpen(true)} title="Kamerayla okut">
              <Icon icon="camera" />
            </Button>
          )}
          <Button variant="outline-secondary" onClick={() => setSearchOpen(true)} title="Ürün ara">
            <Icon icon="search" />
            <span className="d-none d-md-inline ms-1">Ara</span>
          </Button>
        </InputGroup>

        <CameraScanner
          show={cameraOpen}
          onClose={() => setCameraOpen(false)}
          onDetected={(code) => {
            setCameraOpen(false)
            onBarcode(code)
          }}
        />
        <ProductSearchModal
          show={searchOpen}
          onClose={() => setSearchOpen(false)}
          onSelect={(p) => {
            setSearchOpen(false)
            onPickProduct(p)
          }}
        />
      </>
    )
  },
)
BarcodeInput.displayName = 'BarcodeInput'
export default BarcodeInput

const CameraScanner = ({ show, onClose, onDetected }: { show: boolean; onClose: () => void; onDetected: (code: string) => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const onDetectedRef = useRef(onDetected)
  onDetectedRef.current = onDetected

  useEffect(() => {
    if (!show || !window.BarcodeDetector) return undefined
    let stream: MediaStream | null = null
    let timer: number | undefined
    let stopped = false
    const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf'] })
    setError(null)

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((s) => {
        stream = s
        if (!videoRef.current) return
        videoRef.current.srcObject = s
        videoRef.current.play()
        const tick = async () => {
          if (stopped || !videoRef.current) return
          try {
            const codes = await detector.detect(videoRef.current)
            if (codes[0]?.rawValue) {
              stopped = true
              onDetectedRef.current(codes[0].rawValue)
              return
            }
          } catch {
            /* kare henüz hazır değil */
          }
          timer = window.setTimeout(tick, 250)
        }
        tick()
      })
      .catch(() => setError('Kameraya erişilemedi. Tarayıcı izinlerini kontrol edin.'))

    return () => {
      stopped = true
      if (timer) clearTimeout(timer)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [show])

  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Kamerayla Barkod Okut</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0 bg-dark position-relative">
        {error ? (
          <div className="text-white text-center p-5">{error}</div>
        ) : (
          <>
            <video ref={videoRef} className="w-100" style={{ maxHeight: 480, objectFit: 'cover' }} muted playsInline />
            <div
              className="position-absolute top-50 start-50 translate-middle border border-3 border-white rounded-3"
              style={{ width: '70%', aspectRatio: '1.8', pointerEvents: 'none' }}
            />
          </>
        )}
      </Modal.Body>
    </Modal>
  )
}

// Katalogda ada/markaya/barkoda göre arayıp ürün seçer
export const ProductSearchModal = ({ show, onClose, onSelect }: { show: boolean; onClose: () => void; onSelect: (p: Product) => void }) => {
  const { storeId } = useStore()
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!show) {
      setQuery('')
      setItems([])
    }
  }, [show])

  useEffect(() => {
    if (!storeId || query.trim().length < 2) {
      setItems([])
      return undefined
    }
    let cancelled = false
    const timer = window.setTimeout(async () => {
      setLoading(true)
      try {
        const res = await retailApi.products(storeId, { q: query.trim(), scope: 'catalog', pageSize: 25 })
        if (!cancelled) setItems(res.items)
      } catch {
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query, storeId])

  return (
    <Modal show={show} onHide={onClose} centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>Ürün Ara</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Control autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ürün adı, marka veya barkod (en az 2 karakter)" />
        {loading && (
          <div className="text-center py-3">
            <Spinner animation="border" size="sm" />
          </div>
        )}
        {!loading && query.trim().length >= 2 && items.length === 0 && <div className="text-center text-muted py-3">Sonuç yok.</div>}
        <ListGroup variant="flush" className="mt-2">
          {items.map((p) => (
            <ListGroup.Item key={p.productId} action onClick={() => onSelect(p)} className="d-flex align-items-center gap-2">
              <ProductThumb uri={p.imageUrl} size={36} />
              <div className="flex-grow-1 overflow-hidden">
                <div className="fw-semibold text-truncate">{p.name}</div>
                <div className="text-muted fs-xs">{[p.brand, p.barcode].filter(Boolean).join(' · ')}</div>
              </div>
              <span className="fw-semibold">{p.salePrice != null ? fmt(p.salePrice) : ''}</span>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Modal.Body>
    </Modal>
  )
}
