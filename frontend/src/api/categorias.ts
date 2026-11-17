import { crearRecursoApi } from './crud'
import type { Categoria } from './types'

export interface CategoriaInput {
  nombre: string
  descripcion: string
}

export const categoriasApi = crearRecursoApi<Categoria, CategoriaInput>('categorias')
