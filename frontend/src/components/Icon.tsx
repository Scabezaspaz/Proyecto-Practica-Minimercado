// Componente de íconos SVG del sistema de diseño.
// Portado del mapa de íconos del prototipo (assets/js/app.js).
// Uso: <Icon name="leaf" />  ó  <Icon name="user" className="mi-clase" />

export type IconName =
  | 'dashboard' | 'box' | 'arrow-down' | 'arrow-up' | 'clock' | 'bell'
  | 'user' | 'search' | 'plus' | 'pencil' | 'trash' | 'eye' | 'logout'
  | 'menu' | 'x' | 'chevron-down' | 'check' | 'alert-triangle' | 'info'
  | 'calendar' | 'filter' | 'leaf' | 'refresh' | 'lock' | 'mail'
  | 'arrow-right' | 'external-link' | 'monitor' | 'code' | 'layers' | 'shield'

const PATHS: Record<IconName, string> = {
  dashboard: '<rect x="3.5" y="3.5" width="7.2" height="7.2" rx="1.6"/><rect x="13.3" y="3.5" width="7.2" height="7.2" rx="1.6"/><rect x="3.5" y="13.3" width="7.2" height="7.2" rx="1.6"/><rect x="13.3" y="13.3" width="7.2" height="7.2" rx="1.6"/>',
  box: '<path d="M12 3.5l8.2 4.4v8.2L12 20.5l-8.2-4.4V7.9L12 3.5z"/><path d="M3.9 8l8.1 4.4 8.1-4.4"/><path d="M12 12.4v8.1"/>',
  'arrow-down': '<path d="M12 4.5v12.5"/><path d="M6.5 12l5.5 5.5L17.5 12"/><path d="M4.5 20.5h15"/>',
  'arrow-up': '<path d="M12 19.5V7"/><path d="M17.5 12L12 6.5 6.5 12"/><path d="M4.5 3.5h15"/>',
  clock: '<circle cx="12" cy="12" r="8.3"/><path d="M12 7.6V12l3.2 2"/>',
  bell: '<path d="M6 8.2a6 6 0 0112 0c0 4.8 1.8 6 1.8 6H4.2s1.8-1.2 1.8-6"/><path d="M10.3 19.8a2 2 0 003.4 0"/>',
  user: '<circle cx="12" cy="7.8" r="3.6"/><path d="M5.2 20c.8-3.9 3.4-5.8 6.8-5.8s6 1.9 6.8 5.8"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M15.8 15.8L20 20"/>',
  plus: '<path d="M12 5.5v13M5.5 12h13"/>',
  pencil: '<path d="M4.2 19.8l1.2-4.4L16 4.8a1.8 1.8 0 012.5 2.5L7.9 18l-3.7 1.8z"/><path d="M14 7l3 3"/>',
  trash: '<path d="M4.5 6.5h15"/><path d="M9.2 6.5V4.2h5.6v2.3"/><path d="M6.5 6.5l1 13.3h9l1-13.3"/><path d="M10 10.5v6.2M14 10.5v6.2"/>',
  eye: '<path d="M2.6 12S6 5.8 12 5.8 21.4 12 21.4 12 18 18.2 12 18.2 2.6 12 2.6 12z"/><circle cx="12" cy="12" r="2.7"/>',
  logout: '<path d="M14.5 12H4.5"/><path d="M8 7.8L4.3 12 8 16.2"/><path d="M14.5 4.5H18A1.5 1.5 0 0119.5 6v12a1.5 1.5 0 01-1.5 1.5h-3.5"/>',
  menu: '<path d="M4 6.5h16M4 12h16M4 17.5h16"/>',
  x: '<path d="M6.2 6.2l11.6 11.6M17.8 6.2L6.2 17.8"/>',
  'chevron-down': '<path d="M6 9.2l6 6 6-6"/>',
  check: '<path d="M4.8 12.6l4.6 4.6L19.2 7"/>',
  'alert-triangle': '<path d="M12 4.6L2.8 19.6h18.4L12 4.6z"/><path d="M12 10v4.2"/><path d="M12 17.2v.1"/>',
  info: '<circle cx="12" cy="12" r="8.3"/><path d="M12 11v5.2"/><path d="M12 7.6v.1"/>',
  calendar: '<rect x="4.2" y="5.6" width="15.6" height="14.7" rx="2"/><path d="M4.2 10h15.6M8.5 3.8v3.4M15.5 3.8v3.4"/>',
  filter: '<path d="M4 6h16M7.5 12h9M10.5 18h3"/>',
  leaf: '<path d="M4.5 19.5C4.5 10.8 11.2 4.5 19.6 4.5c.2 8.4-6.1 15-15.1 15z"/><path d="M4.8 19.2c2.8-4 6.2-7.2 10-9.4"/>',
  refresh: '<path d="M19.5 12a7.5 7.5 0 11-2.2-5.3"/><path d="M19.7 3.8v3.4h-3.4"/>',
  lock: '<rect x="5.5" y="10.5" width="13" height="9" rx="2"/><path d="M8.4 10.5V8.2a3.6 3.6 0 017.2 0v2.3"/><path d="M12 15v1.5"/>',
  mail: '<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M4.6 7.6L12 13l7.4-5.4"/>',
  'arrow-right': '<path d="M4.5 12h15M13 6l6 6-6 6"/>',
  'external-link': '<path d="M13.5 5H18.5A1.5 1.5 0 0120 6.5v5"/><path d="M20 4.5L11.5 13"/><path d="M10 5H6.5A1.5 1.5 0 005 6.5v11A1.5 1.5 0 006.5 19H18a1.5 1.5 0 001.5-1.5V14"/>',
  monitor: '<rect x="3" y="4.5" width="18" height="12.5" rx="2"/><path d="M8 21h8M12 17v4"/>',
  code: '<path d="M8.5 8l-4.5 4 4.5 4M15.5 8l4.5 4-4.5 4"/>',
  layers: '<path d="M12 4l9 5-9 5-9-5 9-5z"/><path d="M3 14.5l9 5 9-5"/>',
  shield: '<path d="M12 3.5l7 2.8v5.4c0 4.2-2.9 7.4-7 8.8-4.1-1.4-7-4.6-7-8.8V6.3l7-2.8z"/>',
}

type IconProps = {
  name: IconName
  className?: string
}

export default function Icon({ name, className = '' }: IconProps) {
  return (
    <svg
      className={`icon ${className}`.trim()}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: PATHS[name] }}
    />
  )
}