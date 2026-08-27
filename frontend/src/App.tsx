import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Productos from './pages/Productos'
import ProductoDetalle from './pages/ProductoDetalle'
import ReporteProducto from './pages/ReporteProducto'
import Movimientos from './pages/Movimientos'
import Reportes from './pages/Reportes'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/productos/:id" element={<ProductoDetalle />} />
        <Route path="/productos/:id/reporte" element={<ReporteProducto />} />
        <Route path="/movimientos" element={<Movimientos />} />
        <Route path="/reportes" element={<Reportes />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App