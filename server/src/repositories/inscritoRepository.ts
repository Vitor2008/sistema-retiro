import { and, asc, eq, isNull } from 'drizzle-orm'
import { db } from '../db/client.js'
import { inscritos, pagamentos } from '../db/schema.js'
import type { Inscrito, Pagamento } from '../types.js'

type InscritoRow = typeof inscritos.$inferSelect
type PagamentoRow = typeof pagamentos.$inferSelect

function toDTO(row: InscritoRow, pags: PagamentoRow[]): Inscrito {
  return {
    id: row.id,
    nome: row.nome,
    genero: row.genero as Inscrito['genero'],
    tipo: row.tipo as Inscrito['tipo'],
    idade: row.idade,
    dataNascimento: row.dataNascimento,
    valor: row.valor,
    vez: row.vez,
    lider: row.lider,
    predio: row.predio,
    conducao: row.conducao,
    forma: row.forma,
    tel: row.tel,
    statusInscricao: row.statusInscricao as Inscrito['statusInscricao'],
    cancelInfo: row.cancelInfo,
    comprovante: row.comprovante,
    comprovanteId: row.comprovanteId,
    quarto: row.quarto,
    criadoEm: row.criadoEm,
    cortesia: row.cortesia,
    cortesiaMotivo: row.cortesiaMotivo,
    presente: row.presente,
    pagamentos: pags
      .sort((a, b) => a.ordem - b.ordem)
      .map((p) => ({
        valor: p.valor,
        oferta: p.oferta,
        forma: p.forma,
        obs: p.obs,
        data: p.data,
        usuario: p.usuario,
        dataPrevista: p.dataPrevista,
      })),
  }
}

async function inserirPagamentos(inscritoId: string, pags: Pagamento[]) {
  if (!pags.length) return
  await db.insert(pagamentos).values(
    pags.map((p, i) => ({
      inscritoId,
      ordem: i,
      valor: p.valor,
      oferta: p.oferta,
      forma: p.forma,
      obs: p.obs,
      data: p.data,
      usuario: p.usuario,
      dataPrevista: p.dataPrevista ?? null,
    })),
  )
}

export const inscritoRepository = {
  /** Inscrições do retiro (ou todas), sem as excluídas. */
  async list(retiroId?: string): Promise<Inscrito[]> {
    const naoExcluido = isNull(inscritos.excluidoEm)
    const rows = await db
      .select()
      .from(inscritos)
      .where(retiroId ? and(eq(inscritos.retiroId, retiroId), naoExcluido) : naoExcluido)
      .orderBy(asc(inscritos.id))
    const pags = await db.select().from(pagamentos)
    const porInscrito = new Map<string, PagamentoRow[]>()
    for (const p of pags) {
      const arr = porInscrito.get(p.inscritoId) ?? []
      arr.push(p)
      porInscrito.set(p.inscritoId, arr)
    }
    return rows.map((r) => toDTO(r, porInscrito.get(r.id) ?? []))
  },

  async get(id: string): Promise<Inscrito | null> {
    const [row] = await db
      .select()
      .from(inscritos)
      .where(and(eq(inscritos.id, id), isNull(inscritos.excluidoEm)))
    if (!row) return null
    const pags = await db
      .select()
      .from(pagamentos)
      .where(eq(pagamentos.inscritoId, id))
    return toDTO(row, pags)
  },

  async create(dto: Inscrito, retiroId: string): Promise<Inscrito> {
    await db.insert(inscritos).values({
      id: dto.id,
      retiroId,
      nome: dto.nome,
      genero: dto.genero,
      tipo: dto.tipo,
      idade: dto.idade,
      dataNascimento: dto.dataNascimento,
      valor: dto.valor ?? null,
      vez: dto.vez,
      lider: dto.lider,
      predio: dto.predio,
      conducao: dto.conducao,
      forma: dto.forma,
      tel: dto.tel,
      statusInscricao: dto.statusInscricao,
      cancelInfo: dto.cancelInfo,
      comprovante: dto.comprovante,
      comprovanteId: dto.comprovanteId,
      quarto: dto.quarto,
      criadoEm: dto.criadoEm || new Date().toISOString(),
      cortesia: dto.cortesia ?? false,
      cortesiaMotivo: dto.cortesiaMotivo ?? '',
      presente: dto.presente ?? false,
    })
    await inserirPagamentos(dto.id, dto.pagamentos)
    return dto
  },

  async update(id: string, dto: Inscrito): Promise<Inscrito> {
    await db
      .update(inscritos)
      .set({
        nome: dto.nome,
        genero: dto.genero,
        tipo: dto.tipo,
        idade: dto.idade,
        dataNascimento: dto.dataNascimento,
        valor: dto.valor ?? null,
        vez: dto.vez,
        lider: dto.lider,
        predio: dto.predio,
        conducao: dto.conducao,
        forma: dto.forma,
        tel: dto.tel,
        statusInscricao: dto.statusInscricao,
        cancelInfo: dto.cancelInfo,
        comprovante: dto.comprovante,
        comprovanteId: dto.comprovanteId,
        quarto: dto.quarto,
        cortesia: dto.cortesia ?? false,
        cortesiaMotivo: dto.cortesiaMotivo ?? '',
        presente: dto.presente ?? false,
      })
      .where(eq(inscritos.id, id))
    // pagamentos: substitui o conjunto (replace-all é suficiente aqui)
    await db.delete(pagamentos).where(eq(pagamentos.inscritoId, id))
    await inserirPagamentos(id, dto.pagamentos)
    return dto
  },

  /** Exclusão LÓGICA: marca excluido_em em vez de apagar a linha. Se a linha
   *  fosse apagada, o próximo snapshot de um aparelho que ainda a tem em cache
   *  a recriaria (o snapshot faz upsert de inscritos). Com a marca, o upsert só
   *  atualiza a linha, que continua oculta. */
  async remove(id: string): Promise<void> {
    await db
      .update(inscritos)
      .set({ excluidoEm: new Date().toISOString(), quarto: null })
      .where(eq(inscritos.id, id))
  },
}
