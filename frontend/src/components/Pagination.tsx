type Props = {
  page: number
  pageSize: number
  total: number
  onChange: (page: number) => void
}

// Paginación simple del lado del cliente (Anterior / Siguiente).
export default function Pagination({ page, pageSize, total, onChange }: Props) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  // No mostramos controles si todo cabe en una sola página.
  if (total <= pageSize) return null

  const desde = (page - 1) * pageSize + 1
  const hasta = Math.min(page * pageSize, total)

  return (
    <div className="pagination">
      <span>
        Mostrando <b>{desde}</b>–<b>{hasta}</b> de <b>{total}</b>
      </span>
      <div className="pg-btns">
        <button
          className="btn btn-secondary"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Anterior
        </button>
        <span style={{ alignSelf: 'center' }}>Página {page} de {pageCount}</span>
        <button
          className="btn btn-secondary"
          disabled={page >= pageCount}
          onClick={() => onChange(page + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}
