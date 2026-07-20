// ============================================================================
// Controle de acesso por "tipo de acesso" (não granular por usuário).
// Cada acesso libera um conjunto fixo de páginas (keys da navegação).
// ============================================================================

export type Acesso = 'adm' | 'financeiro' | 'cantina' | 'quarto' | 'servico'

export interface AcessoDef {
  id: Acesso
  label: string
  descricao: string
  /** keys de navegação liberadas (vazio para 'adm', que libera tudo). */
  navKeys: string[]
}

export const ACESSOS: AcessoDef[] = [
  { id: 'adm', label: 'Administrador', descricao: 'Acesso a todas as áreas e à gestão de usuários', navKeys: [] },
  { id: 'financeiro', label: 'Financeiro', descricao: 'Eventos, Check-in e Prestação de contas', navKeys: ['retiros', 'checkin', 'contas'] },
  { id: 'cantina', label: 'Cantina', descricao: 'Aba de Cantina', navKeys: ['cantina'] },
  { id: 'quarto', label: 'Escala Quarto', descricao: 'Aba de Quartos', navKeys: ['quartos'] },
  { id: 'servico', label: 'Escala Serviço', descricao: 'Aba de Escalas de serviço', navKeys: ['escalas'] },
]

export function labelAcesso(id: string): string {
  return ACESSOS.find((a) => a.id === id)?.label ?? id
}

export function isAdmin(acessos: string[] | undefined | null): boolean {
  return !!acessos && acessos.includes('adm')
}

/** Conjunto de keys de navegação permitidas — 'all' para administrador. */
export function allowedNavKeys(acessos: string[] | undefined | null): 'all' | Set<string> {
  if (isAdmin(acessos)) return 'all'
  const set = new Set<string>()
  ;(acessos ?? []).forEach((a) => {
    ACESSOS.find((x) => x.id === a)?.navKeys.forEach((k) => set.add(k))
  })
  return set
}

/** O usuário pode acessar a página com essa key? */
export function canAccess(acessos: string[] | undefined | null, key: string): boolean {
  const allowed = allowedNavKeys(acessos)
  return allowed === 'all' || allowed.has(key)
}
