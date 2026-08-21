import { Link, useNavigate } from 'react-router-dom'
import { logout } from '../api/auth'

export default function Dashboard() {
  const navigate = useNavigate()

  const cerrarSesion = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <h1 className="text-2xl font-bold text-emerald-700 mb-4">
        Dashboard (pendiente de diseño)
      </h1>

      <nav className="flex gap-4 mb-6">
        <Link to="/" className="text-emerald-700 underline">Inicio</Link>
        <Link to="/productos" className="text-emerald-700 underline">Productos</Link>
        <Link to="/movimientos" className="text-emerald-700 underline">Movimientos</Link>
        <button onClick={cerrarSesion} className="text-red-600 underline">
          Cerrar sesión
        </button>
      </nav>

      <p className="text-slate-500">Contenido del dashboard (Paso B6).</p>
    </div>
  )
}