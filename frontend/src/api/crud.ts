import api from './client'

// Cliente genérico para los recursos CRUD de la API (DRF ModelViewSet).
// Cada módulo (categorías, proveedores…) solo indica su ruta y sus tipos,
// sin repetir las mismas peticiones en cada archivo.
export interface RecursoApi<T, Input> {
  listar: (params?: Record<string, string>) => Promise<T[]>
  obtener: (id: string) => Promise<T>
  crear: (data: Input) => Promise<T>
  actualizar: (id: string, data: Partial<Input>) => Promise<T>
  desactivar: (id: string) => Promise<void>
}

export function crearRecursoApi<T, Input>(ruta: string): RecursoApi<T, Input> {
  const base = `/${ruta}/`
  return {
    async listar(params = {}) {
      const limpios = Object.fromEntries(Object.entries(params).filter(([, v]) => v))
      const res = await api.get<T[]>(base, { params: limpios })
      return res.data
    },
    async obtener(id) {
      const res = await api.get<T>(`${base}${id}/`)
      return res.data
    },
    async crear(data) {
      const res = await api.post<T>(base, data)
      return res.data
    },
    // PATCH: solo se envían los campos que cambian.
    async actualizar(id, data) {
      const res = await api.patch<T>(`${base}${id}/`, data)
      return res.data
    },
    async desactivar(id) {
      await api.delete(`${base}${id}/`)
    },
  }
}
