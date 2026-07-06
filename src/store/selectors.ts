// ============================================================================
// Funções derivadas puras sobre o estado. Sem efeitos colaterais — dá para
// testar isoladamente e reutilizar em qualquer view.
// ============================================================================

import { fmtData } from '../lib/format'
import type {
  AppState,
  Escala,
  EscalaDia,
  Inscrito,
  StatusPagamento,
} from '../types'

export function pago(p: Inscrito): number {
  return p.pagamentos.reduce((a, x) => a + (x.valor || 0), 0)
}

export function ofertado(p: Inscrito): number {
  return p.pagamentos.reduce((a, x) => a + (x.oferta || 0), 0)
}

export function statusPag(state: AppState, p: Inscrito): StatusPagamento {
  const t = pago(p) + ofertado(p)
  if (t >= state.retiro.valor) return 'confirmado'
  if (t > 0) return 'parcial'
  return 'pendente'
}

export function ativos(state: AppState): Inscrito[] {
  return state.inscritos.filter((p) => p.statusInscricao !== 'cancelada')
}

export function vagasRestantes(state: AppState): number {
  return Math.max(0, state.retiro.max - ativos(state).length)
}

export function linkAbertoEfetivo(state: AppState): boolean {
  return state.retiro.aberto && vagasRestantes(state) > 0
}

export function servosDoDia(state: AppState, diaKey: EscalaDia): Inscrito[] {
  const alvo = diaKey === 'd1' ? '1º dia' : '2º dia'
  return ativos(state).filter((p) => p.tipo === 'Servo' && p.diaServir === alvo)
}

export function escalaVazia(): Escala {
  const dia = () => ({
    cafe: { prep: [], limp: [] },
    almoco: { prep: [], limp: [] },
    jantar: { prep: [], limp: [] },
  })
  return { d1: dia(), d2: dia() }
}

/** Mapa id -> inscrito, para lookups O(1). */
export function porId(state: AppState): Record<string, Inscrito> {
  const m: Record<string, Inscrito> = {}
  state.inscritos.forEach((p) => (m[p.id] = p))
  return m
}

/** Domínio do link público de inscrição derivado do nome da igreja + slug. */
export function linkPublico(state: AppState, nomeIgreja: string): string {
  return (
    'retiros.' +
    nomeIgreja.toLowerCase().replace(/[^a-z]+/g, '') +
    '.com.br/' +
    state.retiro.slug
  )
}

/** Período do retiro formatado: 'DD/MM/AA a DD/MM/AA'. */
export function periodo(state: AppState): string {
  return fmtData(state.retiro.inicio) + ' a ' + fmtData(state.retiro.fim)
}

/** Totais consolidados da cantina, reaproveitados na Cantina e na Prestação
 *  de contas. */
export function cantinaTotais(state: AppState): {
  vendido: number
  recebido: number
  emAberto: number
  itens: number
  vendas: number
  contasAbertas: number
} {
  let vendido = 0
  let recebido = 0
  let itens = 0
  let contasAbertas = 0
  state.vendas.forEach((v) => {
    const t = v.itens.reduce((a, i) => a + i.valor * i.qtd, 0)
    vendido += t
    if (v.status === 'pago') recebido += t
    else contasAbertas += 1
    v.itens.forEach((i) => (itens += i.qtd))
  })
  return {
    vendido,
    recebido,
    emAberto: vendido - recebido,
    itens,
    vendas: state.vendas.length,
    contasAbertas,
  }
}
