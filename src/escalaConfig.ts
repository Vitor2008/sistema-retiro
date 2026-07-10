import type { EscalaDia, Frente, Turno } from './types'

/** Configuração dos dias do encontro (sexta a domingo).
 *  Cada refeição tem 3 frentes: lavar louça (2 homens), lavar pratos (2) e
 *  limpeza do pátio (2).
 *  - Sexta: só o jantar.
 *  - Sábado: café, almoço e jantar.
 *  - Domingo: café e almoço. */
export interface TurnoConfig {
  key: Turno
  frentes: Frente[]
}

/** Rótulos e regra de cada frente de serviço. */
export const FRENTE_INFO: Record<Frente, { label: string; qtd: number; soHomens: boolean }> = {
  louca: { label: 'Lavar louça', qtd: 2, soHomens: true },
  pratos: { label: 'Lavar pratos', qtd: 2, soHomens: false },
  patio: { label: 'Limpeza do pátio', qtd: 2, soHomens: false },
}

/** Todas as frentes, na ordem de exibição. */
export const FRENTES_TODAS: Frente[] = ['louca', 'pratos', 'patio']
export interface DiaConfig {
  key: EscalaDia
  label: string
  /** dias a somar à data de início do retiro (sexta = 0). */
  offset: number
  turnos: TurnoConfig[]
}

export const TURNO_INFO: Record<Turno, { label: string; hora: string }> = {
  cafe: { label: 'Café da manhã', hora: '06h30 – 08h00' },
  almoco: { label: 'Almoço', hora: '11h30 – 13h30' },
  jantar: { label: 'Jantar', hora: '18h30 – 20h30' },
}

export const DIAS_ESCALA: DiaConfig[] = [
  {
    key: 'sexta',
    label: 'Sexta',
    offset: 0,
    turnos: [{ key: 'jantar', frentes: FRENTES_TODAS }],
  },
  {
    key: 'sabado',
    label: 'Sábado',
    offset: 1,
    turnos: [
      { key: 'cafe', frentes: FRENTES_TODAS },
      { key: 'almoco', frentes: FRENTES_TODAS },
      { key: 'jantar', frentes: FRENTES_TODAS },
    ],
  },
  {
    key: 'domingo',
    label: 'Domingo',
    offset: 2,
    turnos: [
      { key: 'cafe', frentes: FRENTES_TODAS },
      { key: 'almoco', frentes: FRENTES_TODAS },
    ],
  },
]
