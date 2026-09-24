import { useState } from 'react'
import { Link } from 'react-router'
import { Button, Form, FormCheck } from 'react-bootstrap'
import FormCheckInput from 'react-bootstrap/esm/FormCheckInput'
import FormCheckLabel from 'react-bootstrap/esm/FormCheckLabel'
import { useAuth } from '@/hooks/useAuth'

const LoginForm = () => {
  const { login, loading, error } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    login(email, password)
  }

  return (
    <Form className="mt-4" onSubmit={handleSubmit}>
      {error && <div className="alert alert-danger py-2">{error}</div>}
      <div className="mb-3">
        <div className="input-group">
          <input
            type="email"
            className="form-control py-2 px-3 bg-light bg-opacity-40 border-light"
            placeholder="E-posta adresiniz"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="mb-3">
        <div className="input-group">
          <input
            type="password"
            className="form-control py-2 px-3 bg-light bg-opacity-40 border-light"
            placeholder="Şifreniz"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <FormCheck>
          <FormCheckInput className="form-check-input-light fs-14" type="checkbox" defaultChecked id="rememberMe" />
          <FormCheckLabel>Beni hatırla</FormCheckLabel>
        </FormCheck>
        <Link to="/auth/split/reset-pass" className="text-decoration-underline link-offset-3 text-muted">
          Şifremi unuttum
        </Link>
      </div>
      <div className="d-grid">
        <Button variant="primary" type="submit" className="fw-bold py-2" disabled={loading}>
          {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </Button>
      </div>
      <p className="text-muted text-center mt-3 mb-0">
        Hesabınız yok mu?&nbsp;
        <Link to="/auth/split/sign-up" className="text-decoration-underline link-offset-3 fw-semibold">
          Kayıt Ol
        </Link>
      </p>
    </Form>
  )
}

export default LoginForm
