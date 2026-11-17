// Formatos de presentación compartidos (moneda y fechas en es-CO).

export function fmtMoneda(valor: number | string | null | undefined): string {
  const n = Number(valor) || 0
  return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 2 })
}

// "2026-11-17" -> "17 nov 2026" (sin desfase de zona horaria).
export function fmtFecha(iso: string | null | undefined): string {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Fecha local de hoy en formato AAAA-MM-DD (para inputs type="date").
export function hoyISO(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
