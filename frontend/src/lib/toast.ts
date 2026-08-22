type ToastType = 'success' | 'error' | 'warn' | 'info'

const ICONS: Record<ToastType, string> = {
  success: '<path d="M4.8 12.6l4.6 4.6L19.2 7"/>',
  error: '<path d="M6.2 6.2l11.6 11.6M17.8 6.2L6.2 17.8"/>',
  warn: '<path d="M12 4.6L2.8 19.6h18.4L12 4.6z"/><path d="M12 10v4.2"/><path d="M12 17.2v.1"/>',
  info: '<circle cx="12" cy="12" r="8.3"/><path d="M12 11v5.2"/><path d="M12 7.6v.1"/>',
}

const TITLES: Record<ToastType, string> = {
  success: 'Listo',
  error: 'Ocurrió un problema',
  warn: 'Atención',
  info: 'Información',
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function svg(type: ToastType): string {
  return (
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    ICONS[type] +
    '</svg>'
  )
}

export function toast(message: string, type: ToastType = 'success') {
  let root = document.querySelector('.toast-root')
  if (!root) {
    root = document.createElement('div')
    root.className = 'toast-root'
    document.body.appendChild(root)
  }

  const el = document.createElement('div')
  el.className = `toast toast-${type}`
  el.setAttribute('role', 'status')
  el.innerHTML =
    `<span class="toast-icon">${svg(type)}</span>` +
    `<div><strong>${TITLES[type]}</strong><span>${escapeHtml(message)}</span></div>`
  root.appendChild(el)

  setTimeout(() => {
    el.classList.add('out')
    setTimeout(() => el.remove(), 260)
  }, 4200)
}