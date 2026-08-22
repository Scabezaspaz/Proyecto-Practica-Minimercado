import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// Cliente de Axios que usaremos para todas las peticiones a la API
const api = axios.create({
  baseURL: API_URL,
})

// Antes de cada petición, agrega el token si existe (localStorage o sessionStorage)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access') || sessionStorage.getItem('access')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Si la API responde 401 (token vencido o inválido), cierra sesión
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('access')
      localStorage.removeItem('refresh')
      sessionStorage.removeItem('access')
      sessionStorage.removeItem('refresh')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api