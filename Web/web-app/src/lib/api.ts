import axios from 'axios'

const api = axios.create({ baseURL: '/api/web' })

api.interceptors.request.use((config) => {
  const raw = sessionStorage.getItem('token')
  const token = raw ? raw.replace(/^"|"$/g, '') : null
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api
