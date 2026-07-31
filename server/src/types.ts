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
  idade: number | null
  dataNascimento: string
  vez: string
  lider: string
  predio: string
  conducao: string
  forma: string
  tel: string
  statusInscricao: 'pendente' | 'confirmada' | 'cancelada'
  cancelInfo: string
  comprovante: boolean
  comprovanteId: string | null
  quarto: string | null
  criadoEm: string
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
  id: string
  nome: string
  inicio: string
  fim: string
  valor: number
  max: number
  oferta: number
  local: string
  saida: string
  tipo: string
  descricao: string
  linkPagamento: string
  mostrarLider: boolean
  mostrarPredio: boolean
  mostrarConducao: boolean
  aberto: boolean
  slug: string
  bannerId: string | null
  criadoEm: string
}

/** Líder de um retiro, vinculado a um prédio (nome). */
export interface Lider {
  nome: string
  predio: string
}

/** Prédio persistente (edifício/igreja) e o retiro em que participa. */
export interface Predio {
  id: number
  nome: string
  retiroId: string | null
}

export type Escala = Record<string, unknown> | null

/** Snapshot de UM retiro — payload de sincronização com o frontend.
 *  `predios` é apenas leitura (nomes participando); prédios são gerenciados
 *  por endpoints próprios, não pelo replace-all do snapshot. */
export interface DomainSnapshot {
  retiro: Retiro
  lideres: Lider[]
  categorias: string[]
  predios: string[]
  conducoes: string[]
  inscritos: Inscrito[]
  quartos: Quarto[]
  produtos: Produto[]
  vendas: Venda[]
  despesas: Despesa[]
  escala: Escala
}
