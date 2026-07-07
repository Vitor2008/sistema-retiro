// ============================================================================
// Tipos de domínio do Sistema de Retiros.
// ============================================================================

export type Genero = 'M' | 'F'
export type TipoInscricao = 'Encontrista' | 'Servo'
export type StatusInscricao = 'pendente' | 'confirmada' | 'cancelada'
export type StatusPagamento = 'pendente' | 'parcial' | 'confirmado'
export type DiaServir = '' | '1º dia' | '2º dia'
export type EscalaDia = 'sexta' | 'sabado' | 'domingo'
export type Turno = 'cafe' | 'almoco' | 'jantar'
export type Frente = 'prep' | 'limp'

export type FormaPagamento =
  | 'Dinheiro'
  | 'Pix'
  | 'Débito'
  | 'Crédito à vista'
  | 'Crédito parcelado'
  | 'Oferta'
  | 'Crédito'
  | ''

/** Referência a um arquivo persistido (comprovante/nota). O blob fica no IndexedDB. */
export interface Attachment {
  /** Nome original do arquivo, para exibição. */
  name: string
  /** Chave do blob no IndexedDB (via fileService). Vazio = legado/sem blob. */
  fileId: string
}

export interface Pagamento {
  valor: number
  oferta: number
  forma: FormaPagamento
  obs: string
  data: string
  usuario: string
  dataPrevista?: string | null
}

export interface Inscrito {
  id: string
  nome: string
  genero: Genero
  tipo: TipoInscricao
  diaServir: DiaServir
  lider: string
  forma: FormaPagamento
  parcelas: number | null
  tel: string
  statusInscricao: StatusInscricao
  cancelInfo: string
  pagamentos: Pagamento[]
  comprovante: boolean
  /** id do arquivo de comprovante no backend (bytea), se houver. */
  comprovanteId: string | null
  quarto: string | null
}

export interface Quarto {
  id: string
  nome: string
  genero: Genero
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
  /** Forma(s) de pagamento. Pode ser um resumo combinado, ex.: "Pix R$ 20,00 + Dinheiro R$ 30,00". */
  forma: string
  status: 'pago' | 'pendente'
  data: string
  itens: ItemVenda[]
}

/** Uma parcela de pagamento na hora de fechar a conta (forma + valor digitado). */
export interface PagamentoLinha {
  forma: FormaPagamento
  valor: string
}

export interface Despesa {
  id: string
  categoria: string
  descricao: string
  valor: number
  anexo: string
  /** id do arquivo de comprovante/nota no backend (bytea), se houver. */
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

export type CelulaEscala = Record<Frente, string[]>
export type DiaEscala = Record<Turno, CelulaEscala>
export type Escala = Record<EscalaDia, DiaEscala>

export type CantinaTab = 'venda' | 'contas' | 'produtos' | 'resumo'

export interface FormInscricao {
  nome: string
  tel: string
  genero: Genero | ''
  tipo: TipoInscricao
  dia: DiaServir
  lider: string
  forma: FormaPagamento
  parcelas: string
  comprovante: Attachment | null
  erros: Record<string, number>
  enviado: boolean
}

// ---- Modais (discriminated union pelo campo `type`) --------------------------

export interface ModalCancelar {
  type: 'cancelar'
  pid: string
  obs: string
}
export interface ModalPagamento {
  type: 'pagamento'
  pid: string
  valorPago: string
  forma: FormaPagamento
  obs: string
  oferta: boolean
  dataPrevista: string
  comprovante: Attachment | null
}
export interface ModalRetiro {
  type: 'retiro'
  novo: boolean
  nome: string
  inicio: string
  fim: string
  valor: string
  max: string
}
export interface ModalQuarto {
  type: 'quarto'
  nome: string
  genero: Genero
  cap: string
}
export interface ModalProduto {
  type: 'produto'
  pid: string | null
  nome: string
  valor: string
  estoque: string
}
export interface ModalDespesa {
  type: 'despesa'
  categoria: string
  descricao: string
  valor: string
  comprovante: Attachment | null
}
export interface ModalFecharConta {
  type: 'fecharConta'
  vid: string
  pagamentos: PagamentoLinha[]
}

export interface ModalEditarConta {
  type: 'editarConta'
  vid: string
  itens: ItemVenda[]
}

export type Modal =
  | ModalCancelar
  | ModalPagamento
  | ModalRetiro
  | ModalQuarto
  | ModalProduto
  | ModalDespesa
  | ModalFecharConta
  | ModalEditarConta
  | null

/** Estado global da aplicação. */
export interface AppState {
  narrow: boolean
  sbOpen: boolean
  retiro: Retiro
  retirosPassados: RetiroPassado[]
  lideres: string[]
  inscritos: Inscrito[]
  quartos: Quarto[]
  produtos: Produto[]
  vendas: Venda[]
  despesas: Despesa[]
  categorias: string[]
  escala: Escala | null
  escalaDia: EscalaDia
  ciBusca: string
  ciTipo: 'todos' | 'servo' | 'enc'
  ciPag: 'todos' | 'pend' | 'ok'
  qGenero: Genero
  dragId: string | null
  selId: string | null
  form: FormInscricao
  carrinho: ItemVenda[]
  vendaTipo: 'avulsa' | 'anotada'
  vendaForma: FormaPagamento
  vCliente: string
  cantinaTab: CantinaTab
  modal: Modal
  toast: string | null
}

/** Configurações do app (equivalentes aos "props" do protótipo original). */
export interface AppConfig {
  nomeIgreja: string
  nomeIgrejaCompleto: string
  logoUrl: string
  modoCompacto: boolean
}
