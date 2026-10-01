import { useEffect, useRef, useState } from 'react'
import axios from 'axios'

declare global {
  interface Window {
    google?: any
  }
}

const GIS_SRC = 'https://accounts.google.com/gsi/client'

const loadGis = () =>
  new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve()
    let script = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`)
    if (!script) {
      script = document.createElement('script')
      script.src = GIS_SRC
      script.async = true
      document.head.appendChild(script)
    }
    script.addEventListener('load', () => resolve())
    script.addEventListener('error', () => reject(new Error('Google betiği yüklenemedi')))
  })

type Props = {
  onCredential: (idToken: string) => void
  text?: 'signin_with' | 'signup_with' | 'continue_with'
}

// Client ID backend'den okunur, böylece web imajını yeniden derlemeden değiştirilebilir.
// Google yapılandırılmamışsa buton hiç gösterilmez.
const GoogleSignInButton = ({ onCredential, text = 'continue_with' }: Props) => {
  const ref = useRef<HTMLDivElement>(null)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await axios.get('/api/auth/auth/google/config')
        if (!data?.webClientId || cancelled) return
        await loadGis()
        if (cancelled || !ref.current) return
        window.google.accounts.id.initialize({
          client_id: data.webClientId,
          callback: (res: { credential: string }) => onCredential(res.credential),
        })
        window.google.accounts.id.renderButton(ref.current, {
          theme: 'outline',
          size: 'large',
          text,
          locale: 'tr',
          width: ref.current.offsetWidth || 300,
        })
        setEnabled(true)
      } catch {
        // Google girişi kullanılamıyor — e-posta/şifre ile devam edilir
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div style={{ display: enabled ? undefined : 'none' }}>
      <div className="d-flex align-items-center my-3 text-muted">
        <hr className="flex-grow-1" />
        <span className="px-2 fs-13">veya</span>
        <hr className="flex-grow-1" />
      </div>
      <div ref={ref} className="d-flex justify-content-center" />
    </div>
  )
}

export default GoogleSignInButton
