import api from './client'

// Inicia sesión contra la API y guarda los tokens
export async function login(username: string, password: string) {
  const response = await api.post('/auth/login/', {
    username,
    password,
  })

  localStorage.setItem('access', response.data.access)
  localStorage.setItem('refresh', response.data.refresh)
}

// Cierra sesión: borra los tokens
export function logout() {
  localStorage.removeItem('access')
  localStorage.removeItem('refresh')
}

// Indica si el usuario tiene sesión activa
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('access')
}