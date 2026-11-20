import type { InputHTMLAttributes } from 'react'
import { formatearCantidad, formatearPesos } from '../lib/numeros'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  value: string
  onChange: (valor: string) => void
}

// Campos numéricos en formato colombiano (ver lib/numeros.ts).
// Son de texto a propósito: el type="number" del navegador interpreta
// mal la coma decimal y el punto de miles.

/** Precio en pesos: puntos de miles al escribir y centavos opcionales con coma. */
export function PesosInput({ value, onChange, className = 'input', ...rest }: Props) {
  return (
    <input
      {...rest}
      className={className}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={value}
      onChange={(e) => onChange(formatearPesos(e.target.value))}
    />
  )
}

/** Cantidad con hasta 2 decimales; acepta coma o punto como decimal. */
export function CantidadInput({ value, onChange, className = 'input', ...rest }: Props) {
  return (
    <input
      {...rest}
      className={className}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={value}
      onChange={(e) => onChange(formatearCantidad(e.target.value))}
    />
  )
}
