import api from './client'

const ACCESS = 'access'
const REFRESH = 'refresh'
const USERNAME = 'username'

// Inicia sesión contra la API (con correo electrónico) y guarda los
// tokens + el nombre de usuario que devuelve el backend.
//   recordar = true  -> localStorage   (persiste al cerrar el navegador)
//   recordar = false -> sessionStorage (se borra al cerrar el navegador)
export async function login(correo: string, password: string, recordar = true) {
  const response = await api.post('/auth/login/', { correo, password })

  logout() // limpia cualquier sesión previa en ambos almacenamientos

  const store = recordar ? localStorage : sessionStorage
  store.setItem(ACCESS, response.data.access)
  store.setItem(REFRESH, response.data.refresh)
  store.setItem(USERNAME, response.data.username || correo)
}

// Cierra sesión: borra todo de ambos almacenamientos
export function logout() {
  localStorage.removeItem(ACCESS)
  localStorage.removeItem(REFRESH)
  localStorage.removeItem(USERNAME)
  sessionStorage.removeItem(ACCESS)
  sessionStorage.removeItem(REFRESH)
  sessionStorage.removeItem(USERNAME)
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS) || sessionStorage.getItem(ACCESS)
}

export function getUsername(): string {
  return localStorage.getItem(USERNAME) || sessionStorage.getItem(USERNAME) || 'Usuario'
}

export function isAuthenticated(): boolean {
  return !!getAccessToken()
}

// --- Recuperación de contraseña ---

// Paso 1: verifica si existe una cuenta activa con ese correo.
export async function verificarCorreo(correo: string): Promise<boolean> {
  const res = await api.post('/auth/password/verificar-correo/', { correo })
  return Boolean(res.data?.existe)
}

// Paso 2: restablece la contraseña del usuario asociado a ese correo.
export async function restablecerPassword(
  correo: string,
  nueva_password: string,
): Promise<void> {
  await api.post('/auth/password/restablecer/', { correo, nueva_password })
}