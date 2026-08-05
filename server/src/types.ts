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
  /** Valor da inscrição travado no momento em que a pessoa se inscreveu
   *  (preços por lote). Null em inscrições antigas → usa o valor atual do evento. */
  valor?: number | null
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

/** Produto da loja (por evento). */
export interface LojaProduto {
  id: string
  retiroId: string | null
  categoria: 'vestimenta' | 'outros'
  nome: string
  descricao: string
  valor: number
  /** 'imel' (conta padrão da igreja) ou 'outra' (recebedor externo). */
  conta: 'imel' | 'outra'
  /** Chave PIX do recebedor externo (quando conta = 'outra'). */
  pixChave: string
  linkPagamento: string
  fotos: string[]
  ativo: boolean
  criadoEm: string
}

/** Pedido da loja (feito pelo público). */
export interface LojaPedido {
  id: string
  retiroId: string | null
  produtoId: string | null
  produtoNome: string
  categoria: 'vestimenta' | 'outros'
  nome: string
  genero: string
  tipoCamiseta: string
  tamanho: string
  quantidade: number
  valorUnit: number
  valorTotal: number
  forma: string
  comprovante: boolean
  comprovanteId: string | null
  status: string
  criadoEm: string
}

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
