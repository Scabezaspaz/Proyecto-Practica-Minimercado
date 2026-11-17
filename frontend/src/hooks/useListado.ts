import { useCallback, useEffect, useState } from 'react'

// Lógica común de los listados: carga, error y búsqueda con retraso
// (debounce). Cada página solo aporta su función de consulta.
export function useListado<T>(consultar: (q: string) => Promise<T[]>, mensajeError: string) {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')

  const recargar = useCallback(async () => {
    try {
      setLoading(true)
      setItems(await consultar(busqueda.trim()))
      setError('')
    } catch {
      setError(mensajeError)
    } finally {
      setLoading(false)
    }
  }, [consultar, busqueda, mensajeError])

  useEffect(() => {
    const t = setTimeout(recargar, busqueda ? 350 : 0)
    return () => clearTimeout(t)
  }, [recargar, busqueda])

  return { items, loading, error, busqueda, setBusqueda, recargar }
}
