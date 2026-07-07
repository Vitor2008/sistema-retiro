import type { EscalaDia, Frente, Turno } from './types'

/** Configuração dos dias do encontro (sexta a domingo) e o que cada dia tem.
 *  - Sexta: só o jantar, apenas limpeza.
 *  - Sábado: café, almoço e jantar, com preparo e limpeza.
 *  - Domingo: café e almoço, com preparo e limpeza. */
export interface TurnoConfig {
  key: Turno
  frentes: Frente[]
}
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
    turnos: [{ key: 'jantar', frentes: ['limp'] }],
  },
  {
    key: 'sabado',
    label: 'Sábado',
    offset: 1,
    turnos: [
      { key: 'cafe', frentes: ['prep', 'limp'] },
      { key: 'almoco', frentes: ['prep', 'limp'] },
      { key: 'jantar', frentes: ['prep', 'limp'] },
    ],
  },
  {
    key: 'domingo',
    label: 'Domingo',
    offset: 2,
    turnos: [
      { key: 'cafe', frentes: ['prep', 'limp'] },
      { key: 'almoco', frentes: ['prep', 'limp'] },
    ],
  },
]
