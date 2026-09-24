import { useState } from 'react'
import { Button, Form, FormControl } from 'react-bootstrap'
import { useAuth } from '@/hooks/useAuth'

const RegisterForm = () => {
  const { register, loading, error } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    if (password.length < 6) {
      setLocalError('Şifre en az 6 karakter olmalı.')
      return
    }
    if (password !== password2) {
      setLocalError('Şifreler eşleşmiyor.')
      return
    }
    await register(fullName, email, password)
  }

  const displayError = localError ?? error

  return (
    <Form className="mt-4" onSubmit={handleSubmit}>
      {displayError && <div className="alert alert-danger py-2">{displayError}</div>}
      <div className="mb-3">
        <FormControl
          type="text"
          placeholder="Ad Soyad"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="py-2 px-3 bg-light bg-opacity-40 border-light"
        />
      </div>
      <div className="mb-3">
        <FormControl
          type="email"
          placeholder="E-posta adresi"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="py-2 px-3 bg-light bg-opacity-40 border-light"
        />
      </div>
      <div className="mb-3">
        <FormControl
          type="password"
          placeholder="Şifre (en az 6 karakter)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="py-2 px-3 bg-light bg-opacity-40 border-light"
        />
      </div>
      <div className="mb-3">
        <FormControl
          type="password"
          placeholder="Şifre tekrar"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          required
          className="py-2 px-3 bg-light bg-opacity-40 border-light"
        />
      </div>
      <div className="d-grid">
        <Button variant="primary" type="submit" className="fw-bold py-2" disabled={loading}>
          {loading ? 'Kaydediliyor...' : 'Hesap Oluştur'}
        </Button>
      </div>
    </Form>
  )
}

export default RegisterForm
