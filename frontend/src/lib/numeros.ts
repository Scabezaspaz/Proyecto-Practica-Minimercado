// Lectura y escritura de números en formato colombiano.
//
// Los <input type="number"> del navegador no entienden ese formato:
// "1.200" lo toman como 1,2 y "1,5" puede quedar como 15. Por eso los
// campos numéricos son de texto y se interpretan con estas funciones.

const MAX_DIGITOS_PESOS = 10 // el backend guarda hasta 12 dígitos con 2 decimales

// ---- Pesos (COP): puntos de miles y, opcionalmente, centavos con coma ----

/**
 * Formatea mientras se escribe: "1200" -> "1.200", "1200,5" -> "1.200,5".
 * El punto siempre es de miles; la coma separa los centavos (máximo 2).
 */
export function formatearPesos(texto: string): string {
  const coma = texto.indexOf(',')
  const entera = (coma === -1 ? texto : texto.slice(0, coma))
    .replace(/\D/g, '')
    .replace(/^0+(?=\d)/, '')
    .slice(0, MAX_DIGITOS_PESOS)
  const miles = entera.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  if (coma === -1) return miles
  const centavos = texto.slice(coma + 1).replace(/\D/g, '').slice(0, 2)
  return `${miles || '0'},${centavos}`
}

/** Valor para enviar a la API: "1.200,50" -> "1200.50". */
export function pesosAApi(texto: string): string {
  return texto.replace(/\./g, '').replace(',', '.').replace(/\.$/, '')
}

export function pesosANumero(texto: string): number {
  return Number(pesosAApi(texto)) || 0
}

// ---- Cantidades: decimales con coma (o punto), máximo 2 --------------------

/**
 * Normaliza lo que escribe el usuario: acepta coma o punto como separador
 * decimal, se queda con uno solo y con máximo 2 decimales. "1.5" -> "1,5".
 */
export function formatearCantidad(texto: string): string {
  let s = texto.replace(/\./g, ',').replace(/[^\d,]/g, '')
  const coma = s.indexOf(',')
  if (coma !== -1) {
    s = s.slice(0, coma + 1) + s.slice(coma + 1).replace(/,/g, '').slice(0, 2)
  }
  s = s.replace(/^0+(?=\d)/, '')
  return s.startsWith(',') ? `0${s}` : s
}

/** Valor para enviar a la API: "1,5" -> "1.5". */
export function cantidadAApi(texto: string): string {
  return texto.replace(',', '.').replace(/\.$/, '')
}

export function cantidadANumero(texto: string): number {
  return Number(cantidadAApi(texto)) || 0
}

/** Valor que llega de la API para mostrarlo en un campo: "10.50" -> "10,5". */
export function cantidadDesdeApi(valor: number | string | null | undefined): string {
  const n = Number(valor)
  return Number.isFinite(n) ? String(n).replace('.', ',') : ''
}
