import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import { login, isAuthenticated } from '../api/auth'

export default function Login() {
  const navigate = useNavigate()

  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [recordar, setRecordar] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errorUsuario, setErrorUsuario] = useState('')
  const [errorPassword, setErrorPassword] = useState('')

  // Si ya hay sesión activa, saltamos directo al dashboard.
  useEffect(() => {
    if (isAuthenticated()) navigate('/', { replace: true })
  }, [navigate])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const u = usuario.trim()
    let ok = true

    if (!u) {
      setErrorUsuario('Ingresa tu usuario.')
      ok = false
    } else {
      setErrorUsuario('')
    }

    if (!password) {
      setErrorPassword('Ingresa tu contraseña.')
      ok = false
    } else {
      setErrorPassword('')
    }

    if (!ok) return

    setLoading(true)
    try {
      await login(u, password, recordar)
      navigate('/', { replace: true })
    } catch {
      setErrorPassword('Usuario o contraseña incorrectos. Verifica tus datos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login">
      <div className="login-card">
        <span className="login-logo"><Icon name="leaf" /></span>
        <h1 className="login-title">Sistema de Gestión de Inventario</h1>
        <p className="login-sub">Inicia sesión para continuar</p>

        <form onSubmit={handleSubmit} noValidate>
          {/* Usuario */}
          <div className={`field ${errorUsuario ? 'invalid' : ''}`}>
            <label htmlFor="usuario">Usuario</label>
            <div className="input-icon">
              <Icon name="user" />
              <input
                className="input"
                type="text"
                id="usuario"
                name="usuario"
                placeholder="admin"
                autoComplete="username"
                value={usuario}
                onChange={(e) => {
                  setUsuario(e.target.value)
                  if (errorUsuario) setErrorUsuario('')
                }}
              />
            </div>
            <span className="error">
              <Icon name="info" />
              <span className="err-text">{errorUsuario}</span>
            </span>
          </div>

          {/* Contraseña */}
          <div className={`field ${errorPassword ? 'invalid' : ''}`}>
            <label htmlFor="password">Contraseña</label>
            <div className="input-wrap">
              <input
                className="input"
                type={showPass ? 'text' : 'password'}
                id="password"
                name="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (errorPassword) setErrorPassword('')
                }}
              />
              <button
                type="button"
                className="toggle-btn"
                aria-label="Mostrar u ocultar contraseña"
                onClick={() => setShowPass((v) => !v)}
              >
                <Icon name={showPass ? 'x' : 'eye'} />
              </button>
            </div>
            <span className="error">
              <Icon name="alert-triangle" />
              <span className="err-text">{errorPassword}</span>
            </span>
          </div>

          {/* Recordarme + olvidé contraseña */}
          <div className="login-foot">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={recordar}
                onChange={(e) => setRecordar(e.target.checked)}
              />
              Recordarme
            </label>
            <a
              className="login-link"
              href="#"
              onClick={(e) => {
                e.preventDefault()
                window.alert('Contacta al administrador del sistema para recuperar tu acceso.')
              }}
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <button
            className={`btn btn-primary btn-block ${loading ? 'loading' : ''}`}
            type="submit"
            disabled={loading}
          >
            Iniciar sesión
          </button>
        </form>

        <p className="login-footer">© 2026 Mini Mercado Ecológico · Proyecto de práctica</p>
      </div>
    </div>
  )
}