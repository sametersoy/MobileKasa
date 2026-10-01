import { useEffect, useState } from 'react'
import axios from 'axios'

declare global {
  interface Window {
    AppleID?: any
  }
}

const APPLE_JS_SRC = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/tr_TR/appleid.auth.js'
// Apple Developer'daki Services ID'ye kayıtlı Return URL ile birebir aynı olmalı
const REDIRECT_PATH = '/auth/split/sign-in'

const loadAppleJs = () =>
  new Promise<void>((resolve, reject) => {
    if (window.AppleID?.auth) return resolve()
    let script = document.querySelector<HTMLScriptElement>(`script[src="${APPLE_JS_SRC}"]`)
    if (!script) {
      script = document.createElement('script')
      script.src = APPLE_JS_SRC
      script.async = true
      document.head.appendChild(script)
    }
    script.addEventListener('load', () => resolve())
    script.addEventListener('error', () => reject(new Error('Apple betiği yüklenemedi')))
  })

type Props = {
  onCredential: (identityToken: string, fullName: string | null) => void
}

// Services ID backend'den okunur; Apple yapılandırılmamışsa buton hiç gösterilmez.
const AppleSignInButton = ({ onCredential }: Props) => {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await axios.get('/api/auth/auth/apple/config')
        if (!data?.webServicesId || cancelled) return
        await loadAppleJs()
        if (cancelled) return
        window.AppleID.auth.init({
          clientId: data.webServicesId,
          scope: 'name email',
          redirectURI: window.location.origin + REDIRECT_PATH,
          usePopup: true,
        })
        setEnabled(true)
      } catch {
        // Apple girişi kullanılamıyor — diğer yöntemlerle devam edilir
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const onClick = async () => {
    try {
      const res = await window.AppleID.auth.signIn()
      const token = res?.authorization?.id_token
      if (!token) return
      // Apple adı yalnızca ilk yetkilendirmede verir; token'da yer almaz
      const name = res.user?.name
      const fullName = [name?.firstName, name?.lastName].filter(Boolean).join(' ') || null
      onCredential(token, fullName)
    } catch {
      // kullanıcı pencereyi kapattı / iptal etti
    }
  }

  if (!enabled) return null

  return (
    <div className="d-flex justify-content-center mt-2">
      <button
        type="button"
        onClick={onClick}
        className="btn btn-dark d-flex align-items-center justify-content-center gap-2 w-100"
        style={{ maxWidth: 400, height: 40, borderRadius: 4 }}
      >
        <svg width="16" height="16" viewBox="0 0 814 1000" fill="currentColor" aria-hidden="true">
          <path d="M788 341c-6 4-108 62-108 190 0 148 130 200 134 201-1 3-21 71-68 141-43 61-87 122-155 122s-86-40-164-40c-76 0-104 41-166 41s-106-57-156-127C47 787 0 659 0 538c0-195 127-298 252-298 66 0 121 44 163 44 40 0 102-46 178-46 29 0 132 3 200 103zM554 159c31-37 53-88 53-139 0-7-1-14-2-20-50 2-110 34-146 76-28 32-55 84-55 135 0 8 1 15 2 18 3 1 9 2 14 2 45 0 101-30 134-72z" />
        </svg>
        Apple ile devam et
      </button>
    </div>
  )
}

export default AppleSignInButton
