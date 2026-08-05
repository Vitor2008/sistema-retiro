// ============================================================================
// Funções derivadas puras sobre o estado. Sem efeitos colaterais — dá para
// testar isoladamente e reutilizar em qualquer view.
// ============================================================================

import { fmtData } from '../lib/format'
import type { AppState, Escala, Inscrito, StatusPagamento } from '../types'

export function pago(p: Inscrito): number {
  return p.pagamentos.reduce((a, x) => a + (x.valor || 0), 0)
}

export function ofertado(p: Inscrito): number {
  return p.pagamentos.reduce((a, x) => a + (x.oferta || 0), 0)
}

/** Valor da inscrição da pessoa: o preço travado no cadastro (preços por lote)
 *  ou, se a inscrição não tiver um (legada), o valor atual do evento. */
export function valorInscricao(state: AppState, p: Inscrito): number {
  return p.valor != null ? p.valor : state.retiro.valor
}

export function statusPag(state: AppState, p: Inscrito): StatusPagamento {
  const t = pago(p) + ofertado(p)
  if (t >= valorInscricao(state, p)) return 'confirmado'
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

/** Todos os servos ativos — no encontro (fim de semana) eles servem os 3 dias. */
export function servosServico(state: AppState): Inscrito[] {
  return ativos(state).filter((p) => p.tipo === 'Servo')
}

export function escalaVazia(): Escala {
  const cel = () => ({ louca: [], pratos: [], patio: [] })
  const dia = () => ({ cafe: cel(), almoco: cel(), jantar: cel() })
  return { sexta: dia(), sabado: dia(), domingo: dia() }
}

/** Mapa id -> inscrito, para lookups O(1). */
export function porId(state: AppState): Record<string, Inscrito> {
  const m: Record<string, Inscrito> = {}
  state.inscritos.forEach((p) => (m[p.id] = p))
  return m
}

/** Link público real do formulário de inscrição: <origem>/inscricao/<slug>.
 *  Usa a origem atual do navegador para ser copiável/compartilhável. O segundo
 *  parâmetro (nome da igreja) é mantido por compatibilidade e não é mais usado. */
export function linkPublico(state: AppState, _nomeIgreja?: string): string {
  const origem =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : ''
  return origem + '/inscricao/' + state.retiro.slug
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
