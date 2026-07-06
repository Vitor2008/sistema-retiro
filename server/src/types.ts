// ============================================================================
// DTOs do domínio (espelham src/types.ts do frontend). Mantidos manualmente em
// sincronia; um pacote compartilhado poderia ser extraído no futuro.
// ============================================================================

export interface Pagamento {
  valor: number
  oferta: number
  forma: string
  obs: string
  data: string
  usuario: string
  dataPrevista?: string | null
}

export interface Inscrito {
  id: string
  nome: string
  genero: 'M' | 'F'
  tipo: 'Encontrista' | 'Servo'
  diaServir: string
  lider: string
  forma: string
  parcelas: number | null
  tel: string
  statusInscricao: 'pendente' | 'confirmada' | 'cancelada'
  cancelInfo: string
  comprovante: boolean
  comprovanteId: string | null
  quarto: string | null
  pagamentos: Pagamento[]
}

export interface Quarto {
  id: string
  nome: string
  genero: 'M' | 'F'
  cap: number
  lideres: string[]
}

export interface Produto {
  id: string
  nome: string
  valor: number
  estoque: number
}

export interface ItemVenda {
  id: string
  nome: string
  valor: number
  qtd: number
}

export interface Venda {
  id: string
  tipo: 'avulsa' | 'anotada'
  cliente: string
  forma: string
  status: 'pago' | 'pendente'
  data: string
  itens: ItemVenda[]
}

export interface Despesa {
  id: string
  categoria: string
  descricao: string
  valor: number
  anexo: string
  anexoId: string
}

export interface Retiro {
  nome: string
  inicio: string
  fim: string
  valor: number
  max: number
  aberto: boolean
  slug: string
}

export interface RetiroPassado {
  nome: string
  periodo: string
  inscritos: number
  max: number
  arrecadado: number
  saldo: number
}

export type Escala = Record<string, unknown> | null

/** Snapshot completo do domínio — payload de sincronização com o frontend. */
export interface DomainSnapshot {
  retiro: Retiro
  retirosPassados: RetiroPassado[]
  lideres: string[]
  categorias: string[]
  inscritos: Inscrito[]
  quartos: Quarto[]
  produtos: Produto[]
  vendas: Venda[]
  despesas: Despesa[]
  escala: Escala
}
