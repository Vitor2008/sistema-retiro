// ============================================================================
// Seleção de retiro (multi-retiro). Fica ACIMA do RetiroProvider: busca a lista
// de retiros visíveis ao usuário (adm = todos; demais = do seu prédio), guarda
// o retiro selecionado e permite criar novos.
// ============================================================================

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { apiClient } from '../services/api/apiClient'
import { syncManager } from '../services/sync/syncManager'
import type { Retiro } from '../types'
import { useAuth } from './AuthContext'

const SEL_KEY = 'retiros-selecionado'

interface SelectionValue {
  retiros: Retiro[]
  selectedId: string | null
  loading: boolean
  isAdmin: boolean
  select: (id: string) => void
  reload: () => Promise<void>
  criarRetiro: (input: Partial<Retiro>) => Promise<Retiro>
}

const Ctx = createContext<SelectionValue | null>(null)

export function RetiroSelectionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const isAdmin = !!user?.acessos?.includes('adm')
  const [retiros, setRetiros] = useState<Retiro[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const aplicarLista = useCallback((lista: Retiro[]) => {
    setRetiros(lista)
    setSelectedId((atual) => {
      const salvo = atual ?? localStorage.getItem(SEL_KEY)
      if (salvo && lista.some((r) => r.id === salvo)) return salvo
      return lista[0]?.id ?? null
    })
  }, [])

  const reload = useCallback(async () => {
    try {
      const lista = await apiClient.get<Retiro[]>('/retiros')
      aplicarLista(Array.isArray(lista) ? lista : [])
    } catch {
      setRetiros([])
    } finally {
      setLoading(false)
    }
  }, [aplicarLista])

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    if (selectedId) localStorage.setItem(SEL_KEY, selectedId)
  }, [selectedId])

  const select = useCallback((id: string) => {
    // Garante que pendências do retiro atual subam antes de trocar.
    void syncManager.sync()
    setSelectedId(id)
  }, [])

  const criarRetiro = useCallback(
    async (input: Partial<Retiro>) => {
      const novo = await apiClient.post<Retiro>('/retiros', input)
      await reload()
      setSelectedId(novo.id)
      return novo
    },
    [reload],
  )

  const value: SelectionValue = {
    retiros,
    selectedId,
    loading,
    isAdmin,
    select,
    reload,
    criarRetiro,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRetiroSelection(): SelectionValue {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useRetiroSelection deve ser usado dentro de <RetiroSelectionProvider>')
  return ctx
}
