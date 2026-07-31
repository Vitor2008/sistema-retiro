import { asc, eq } from 'drizzle-orm'
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
  async list(retiroId?: string): Promise<Inscrito[]> {
    const rows = retiroId
      ? await db.select().from(inscritos).where(eq(inscritos.retiroId, retiroId)).orderBy(asc(inscritos.id))
      : await db.select().from(inscritos).orderBy(asc(inscritos.id))
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
    const [row] = await db.select().from(inscritos).where(eq(inscritos.id, id))
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
      })
      .where(eq(inscritos.id, id))
    // pagamentos: substitui o conjunto (replace-all é suficiente aqui)
    await db.delete(pagamentos).where(eq(pagamentos.inscritoId, id))
    await inserirPagamentos(id, dto.pagamentos)
    return dto
  },

  async remove(id: string): Promise<void> {
    await db.delete(inscritos).where(eq(inscritos.id, id))
  },
}
