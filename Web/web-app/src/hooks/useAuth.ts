import { useNavigate } from 'react-router'
import { useState } from 'react'
import { useSessionStorage } from 'usehooks-ts'
import axios from 'axios'

type JwtPayload = {
  sub: string
  email: string
  unique_name: string
  fullName?: string
  role: string
  buildingId?: string
}

const parseJwt = (token: string): JwtPayload => {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(atob(base64))
}

export const useAuth = () => {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken, removeToken] = useSessionStorage<string | null>('token', null)
  const [storedFullName, setStoredFullName, removeFullName] = useSessionStorage<string | null>('fullName', null)

  const userInfo = token ? parseJwt(token) : null
  const role = userInfo?.role ?? null
  const isAuthenticated = !!token

  // fullName: önce sessionStorage'dan, sonra JWT custom claim, sonra unique_name
  const fullName =
    storedFullName ??
    userInfo?.fullName ??
    userInfo?.unique_name ??
    userInfo?.email ??
    null

  const register = async (fullName: string, email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)
      await axios.post('/api/auth/auth/register', { fullName, email, password })
      navigate('/', { replace: true })
      return true
    } catch (err: any) {
      const message = err.response?.data?.message ?? err.response?.data ?? 'Kayıt başarısız'
      setError(typeof message === 'string' ? message : 'Kayıt başarısız')
      return false
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)

      const { data } = await axios.post('/api/auth/auth/login', { email, password })
      setToken(data.token)

      // fullName'i ayrıca sakla — JWT'deki claim mapping'e güvenmeden
      if (data.fullName) setStoredFullName(data.fullName)

      const payload = parseJwt(data.token)
      if (payload.role === 'sakin') {
        navigate('/sakin/panelim', { replace: true })
      } else {
        navigate('/panel', { replace: true })
      }
    } catch (err: any) {
      const message = err.response?.data?.message ?? err.response?.data ?? 'Giriş başarısız'
      setError(typeof message === 'string' ? message : 'Giriş başarısız')
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    removeToken()
    removeFullName()
    navigate('/', { replace: true })
  }

  return {
    login,
    register,
    logout,
    isAuthenticated,
    role,
    userInfo,
    fullName,
    loading,
    error,
  }
}
