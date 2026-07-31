import { retiroRepository } from '../repositories/retiroRepository.js'
import {
  categoriaRepository,
  conducaoRepository,
  predioRepository,
} from '../repositories/listaRepository.js'
import type { Retiro } from '../types.js'
import type { TokenPayload } from './authService.js'

function uid(): string {
  return 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function slugify(nome: string): string {
  // NFD decompõe acentos; remover não-ASCII descarta os diacríticos.
  const base = nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^\x00-\x7f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return base || 'retiro'
}

async function slugUnico(base: string): Promise<string> {
  let slug = base
  let n = 2
  while (await retiroRepository.getBySlug(slug)) {
    slug = base + '-' + n
    n++
  }
  return slug
}

export const retiroService = {
  list: () => retiroRepository.list(),
  get: (id: string) => retiroRepository.get(id),

  /** Retiros visíveis para o usuário: adm vê todos; demais só o do seu prédio. */
  async listForUser(user: TokenPayload): Promise<Retiro[]> {
    if (user.acessos?.includes('adm')) return retiroRepository.list()
    if (!user.predioId) return []
    const predio = await predioRepository.getById(user.predioId)
    if (!predio?.retiroId) return []
    const r = await retiroRepository.get(predio.retiroId)
    return r ? [r] : []
  },

  /** Cria um retiro e semeia as listas padrão (categorias e conduções). */
  async create(input: Partial<Retiro>): Promise<Retiro> {
    if (!input.nome?.trim()) throw new Error('Informe o nome do retiro.')
    const id = uid()
    const slug = await slugUnico(slugify(input.nome))
    const retiro: Retiro = {
      id,
      nome: input.nome.trim(),
      inicio: input.inicio ?? '',
      fim: input.fim ?? '',
      valor: input.valor ?? 0,
      max: input.max ?? 0,
      oferta: 0,
      local: input.local ?? '',
      saida: input.saida ?? '',
      tipo: input.tipo === 'avulso' ? 'avulso' : 'retiro',
      descricao: input.descricao ?? '',
      linkPagamento: input.linkPagamento ?? '',
      mostrarLider: input.mostrarLider !== false,
      mostrarPredio: input.mostrarPredio !== false,
      mostrarConducao: input.mostrarConducao !== false,
      aberto: input.aberto ?? true,
      slug,
      bannerId: input.bannerId ?? null,
      criadoEm: new Date().toISOString(),
    }
    await retiroRepository.create(retiro)
    await categoriaRepository.seedDefaults(id)
    await conducaoRepository.seedDefaults(id)
    return retiro
  },

  async update(id: string, patch: Partial<Retiro>): Promise<Retiro> {
    const atual = await retiroRepository.get(id)
    if (!atual) throw new Error('Retiro não encontrado.')
    await retiroRepository.save(id, { ...patch, id })
    return (await retiroRepository.get(id))!
  },

  remove: (id: string) => retiroRepository.remove(id),
}
