import { Link } from 'react-router-dom'

export default function Movimientos() {
  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <Link to="/" className="text-emerald-700 underline">← Volver al inicio</Link>
      <h1 className="text-2xl font-bold text-emerald-700 mt-4">
        Movimientos (pendiente de diseño)
      </h1>
      <p className="text-slate-500 mt-2">Contenido de movimientos (Paso B8).</p>
    </div>
  )
}