/** Tipos de acesso válidos no sistema. O controle é por acesso (não granular
 *  por usuário): cada acesso libera um conjunto fixo de páginas no frontend. */
export const ACESSOS_VALIDOS = [
  'adm',
  'financeiro',
  'checkin',
  'cantina',
  'quarto',
  'servico',
] as const

export type Acesso = (typeof ACESSOS_VALIDOS)[number]

export function isAcessoValido(a: string): a is Acesso {
  return (ACESSOS_VALIDOS as readonly string[]).includes(a)
}

export function isAdmin(acessos: string[] | undefined | null): boolean {
  return !!acessos && acessos.includes('adm')
}
