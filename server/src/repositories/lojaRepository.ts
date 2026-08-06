import { asc, eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { lojaPedidos, lojaProdutos } from '../db/schema.js'
import type { LojaPedido, LojaProduto } from '../types.js'

type ProdutoRow = typeof lojaProdutos.$inferSelect
type PedidoRow = typeof lojaPedidos.$inferSelect

function toProduto(r: ProdutoRow): LojaProduto {
  return {
    id: r.id,
    retiroId: r.retiroId,
    categoria: r.categoria as LojaProduto['categoria'],
    nome: r.nome,
    descricao: r.descricao,
    valor: r.valor,
    conta: r.conta === 'outra' ? 'outra' : 'imel',
    pixChave: r.pixChave,
    pixNome: r.pixNome,
    pixBanco: r.pixBanco,
    linkPagamento: r.linkPagamento,
    fotos: r.fotos ?? [],
    ativo: r.ativo,
    criadoEm: r.criadoEm,
  }
}

function toPedido(r: PedidoRow): LojaPedido {
  return {
    id: r.id,
    retiroId: r.retiroId,
    produtoId: r.produtoId,
    produtoNome: r.produtoNome,
    categoria: r.categoria as LojaPedido['categoria'],
    nome: r.nome,
    genero: r.genero,
    tipoCamiseta: r.tipoCamiseta,
    tamanho: r.tamanho,
    quantidade: r.quantidade,
    valorUnit: r.valorUnit,
    valorTotal: r.valorTotal,
    forma: r.forma,
    comprovante: r.comprovante,
    comprovanteId: r.comprovanteId,
    status: r.status,
    criadoEm: r.criadoEm,
  }
}

export const lojaRepository = {
  // ---- Produtos ----
  async listProdutos(retiroId: string): Promise<LojaProduto[]> {
    const rows = await db
      .select()
      .from(lojaProdutos)
      .where(eq(lojaProdutos.retiroId, retiroId))
      .orderBy(asc(lojaProdutos.criadoEm))
    return rows.map(toProduto)
  },

  async getProduto(id: string): Promise<LojaProduto | null> {
    const [row] = await db.select().from(lojaProdutos).where(eq(lojaProdutos.id, id))
    return row ? toProduto(row) : null
  },

  async createProduto(dto: LojaProduto): Promise<LojaProduto> {
    await db.insert(lojaProdutos).values({
      id: dto.id,
      retiroId: dto.retiroId,
      categoria: dto.categoria,
      nome: dto.nome,
      descricao: dto.descricao,
      valor: dto.valor,
      conta: dto.conta,
      pixChave: dto.pixChave,
      pixNome: dto.pixNome,
      pixBanco: dto.pixBanco,
      linkPagamento: dto.linkPagamento,
      fotos: dto.fotos,
      ativo: dto.ativo,
      criadoEm: dto.criadoEm || new Date().toISOString(),
    })
    return dto
  },

  async updateProduto(id: string, patch: Partial<LojaProduto>): Promise<void> {
    const set: Record<string, unknown> = {}
    if (patch.categoria !== undefined) set.categoria = patch.categoria
    if (patch.nome !== undefined) set.nome = patch.nome
    if (patch.descricao !== undefined) set.descricao = patch.descricao
    if (patch.valor !== undefined) set.valor = patch.valor
    if (patch.conta !== undefined) set.conta = patch.conta
    if (patch.pixChave !== undefined) set.pixChave = patch.pixChave
    if (patch.pixNome !== undefined) set.pixNome = patch.pixNome
    if (patch.pixBanco !== undefined) set.pixBanco = patch.pixBanco
    if (patch.linkPagamento !== undefined) set.linkPagamento = patch.linkPagamento
    if (patch.fotos !== undefined) set.fotos = patch.fotos
    if (patch.ativo !== undefined) set.ativo = patch.ativo
    if (Object.keys(set).length) await db.update(lojaProdutos).set(set).where(eq(lojaProdutos.id, id))
  },

  async removeProduto(id: string): Promise<void> {
    await db.delete(lojaProdutos).where(eq(lojaProdutos.id, id))
  },

  // ---- Pedidos ----
  async listPedidos(retiroId: string): Promise<LojaPedido[]> {
    const rows = await db
      .select()
      .from(lojaPedidos)
      .where(eq(lojaPedidos.retiroId, retiroId))
      .orderBy(asc(lojaPedidos.criadoEm))
    return rows.map(toPedido).reverse()
  },

  async getPedido(id: string): Promise<LojaPedido | null> {
    const [row] = await db.select().from(lojaPedidos).where(eq(lojaPedidos.id, id))
    return row ? toPedido(row) : null
  },

  async removePedido(id: string): Promise<void> {
    await db.delete(lojaPedidos).where(eq(lojaPedidos.id, id))
  },

  async createPedido(dto: LojaPedido): Promise<LojaPedido> {
    await db.insert(lojaPedidos).values({
      id: dto.id,
      retiroId: dto.retiroId,
      produtoId: dto.produtoId,
      produtoNome: dto.produtoNome,
      categoria: dto.categoria,
      nome: dto.nome,
      genero: dto.genero,
      tipoCamiseta: dto.tipoCamiseta,
      tamanho: dto.tamanho,
      quantidade: dto.quantidade,
      valorUnit: dto.valorUnit,
      valorTotal: dto.valorTotal,
      forma: dto.forma,
      comprovante: dto.comprovante,
      comprovanteId: dto.comprovanteId,
      status: dto.status,
      criadoEm: dto.criadoEm || new Date().toISOString(),
    })
    return dto
  },

  async updatePedidoStatus(id: string, status: string): Promise<void> {
    await db.update(lojaPedidos).set({ status }).where(eq(lojaPedidos.id, id))
  },

  async updatePedidoComprovante(id: string, comprovanteId: string): Promise<void> {
    await db
      .update(lojaPedidos)
      .set({ comprovante: true, comprovanteId })
      .where(eq(lojaPedidos.id, id))
  },
}
