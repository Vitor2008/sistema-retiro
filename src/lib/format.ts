import type { Attachment } from '../types'

/** Formata um número como moeda brasileira: R$ 1.234,56 */
export function fmt(v: number | undefined | null): string {
  return (
    'R$ ' +
    Number(v || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  )
}

/** Gera um id único com prefixo. Resistente a colisão no mesmo milissegundo
 *  (ex.: clique-duplo), pois combina tempo + trecho aleatório. */
export function uid(prefixo: string): string {
  return prefixo + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

/** Iniciais a partir de um nome completo (primeiro + último). */
export function initials(nome: string): string {
  const p = nome.trim().split(/\s+/)
  return (p[0][0] + (p[p.length - 1][0] || '')).toUpperCase()
}

/** Converte 'YYYY-MM-DD' em 'DD/MM/AA'. */
export function fmtData(d: string | undefined | null): string {
  if (!d) return ''
  const [y, m, dd] = d.split('-')
  return dd + '/' + m + '/' + y.slice(2)
}

/** Rótulo de anexo para exibição ('📎 nome' ou fallback). */
export function attachLabel(a: Attachment | null, fallback: string): string {
  return a ? '📎 ' + a.name : fallback
}

/** Carimbo de data/hora curto: 'DD/MM HH:MM'. */
export function stampAgora(): string {
  const agora = new Date()
  return (
    String(agora.getDate()).padStart(2, '0') +
    '/' +
    String(agora.getMonth() + 1).padStart(2, '0') +
    ' ' +
    String(agora.getHours()).padStart(2, '0') +
    ':' +
    String(agora.getMinutes()).padStart(2, '0')
  )
}

/** Carimbo só de data: 'DD/MM'. */
export function stampDia(): string {
  const agora = new Date()
  return (
    String(agora.getDate()).padStart(2, '0') +
    '/' +
    String(agora.getMonth() + 1).padStart(2, '0')
  )
}
