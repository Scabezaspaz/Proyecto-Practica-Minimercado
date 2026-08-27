import { useState, type FormEvent } from 'react'
import Icon from './Icon'
import { verificarCorreo, restablecerPassword } from '../api/auth'
import { apiErrorMessage } from '../api/productos'
import { toast } from '../lib/toast'

type Props = {
  onClose: () => void
}

export default function RecuperarPasswordModal({ onClose }: Props) {
  const [paso, setPaso] = useState<1 | 2>(1)
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  // Paso 1: validar que el correo exista en la base de datos.
  async function verificar(e: FormEvent) {
    e.preventDefault()
    const c = correo.trim()
    if (!c) {
      setError('Ingresa tu correo electrónico.')
      return
    }
    setCargando(true)
    setError('')
    try {
      const existe = await verificarCorreo(c)
      if (existe) {
        setPaso(2)
      } else {
        setError('No existe una cuenta con ese correo. Verifica e intenta de nuevo.')
      }
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo verificar el correo. Intenta más tarde.'))
    } finally {
      setCargando(false)
    }
  }

  // Paso 2: restablecer la contraseña.
  async function restablecer(e: FormEvent) {
    e.preventDefault()
    if (!password) {
      setError('Ingresa la nueva contraseña.')
      return
    }
    if (password !== password2) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setCargando(true)
    setError('')
    try {
      await restablecerPassword(correo.trim(), password)
      toast('Contraseña actualizada. Ya puedes iniciar sesión.', 'success')
      onClose()
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo restablecer la contraseña.'))
    } finally {
      setCargando(false)
    }
  }

  return (
    <div
      className="modal-backdrop open"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal">
        <div className="modal-head">
          <h3>{paso === 1 ? 'Recuperar contraseña' : 'Nueva contraseña'}</h3>
          <button type="button" className="icon-btn" aria-label="Cerrar" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>

        {paso === 1 ? (
          <form onSubmit={verificar}>
            <div className="modal-body">
              <p className="hint" style={{ marginBottom: 14 }}>
                Ingresa el correo asociado a tu cuenta. Verificaremos que exista antes de continuar.
              </p>
              <div className={`field ${error ? 'invalid' : ''}`}>
                <label htmlFor="rp-correo">Correo electrónico</label>
                <div className="input-icon">
                  <Icon name="mail" />
                  <input
                    className="input"
                    id="rp-correo"
                    type="email"
                    autoComplete="email"
                    value={correo}
                    onChange={(e) => {
                      setCorreo(e.target.value)
                      if (error) setError('')
                    }}
                    placeholder="tucorreo@ejemplo.com"
                  />
                </div>
                <span className="error">
                  <Icon name="alert-triangle" />
                  <span className="err-text">{error}</span>
                </span>
              </div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={cargando}>
                Cancelar
              </button>
              <button type="submit" className={`btn btn-primary ${cargando ? 'loading' : ''}`} disabled={cargando}>
                Continuar
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={restablecer}>
            <div className="modal-body">
              <div className="alert alert-warn" style={{ marginBottom: 14 }}>
                <Icon name="check" />
                Cuenta encontrada: <b>{correo.trim()}</b>
              </div>
              <div className={`field ${error ? 'invalid' : ''}`}>
                <label htmlFor="rp-pass">Nueva contraseña</label>
                <div className="input-wrap">
                  <input
                    className="input"
                    id="rp-pass"
                    type={showPass ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (error) setError('')
                    }}
                    placeholder="••••••••"
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
              </div>
              <div className={`field ${error ? 'invalid' : ''}`}>
                <label htmlFor="rp-pass2">Confirmar contraseña</label>
                <input
                  className="input"
                  id="rp-pass2"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password2}
                  onChange={(e) => {
                    setPassword2(e.target.value)
                    if (error) setError('')
                  }}
                  placeholder="••••••••"
                />
                <span className="error">
                  <Icon name="alert-triangle" />
                  <span className="err-text">{error}</span>
                </span>
              </div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-secondary" onClick={() => { setPaso(1); setError('') }} disabled={cargando}>
                Atrás
              </button>
              <button type="submit" className={`btn btn-primary ${cargando ? 'loading' : ''}`} disabled={cargando}>
                Restablecer contraseña
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
