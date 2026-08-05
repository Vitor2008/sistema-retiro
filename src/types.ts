// ============================================================================
// Tipos de domínio do Sistema de Retiros.
// ============================================================================

export type Genero = 'M' | 'F'
export type TipoEvento = 'retiro' | 'avulso'
export type TipoInscricao = 'Encontrista' | 'Servo'
export type StatusInscricao = 'pendente' | 'confirmada' | 'cancelada'
export type StatusPagamento = 'pendente' | 'parcial' | 'confirmado'
export type DiaServir = '' | '1º dia' | '2º dia'
export type EscalaDia = 'sexta' | 'sabado' | 'domingo'
export type Turno = 'cafe' | 'almoco' | 'jantar'
/** Frentes de serviço por refeição: lavar louça (2 homens), lavar pratos e
 *  limpeza do pátio (2 pessoas cada, misto). */
export type Frente = 'louca' | 'pratos' | 'patio'

export type FormaPagamento =
  | 'Dinheiro'
  | 'Pix'
  | 'Cartão'
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

/** Quantas vezes o convidado já participou (campo do formulário público). */
export type Vez = '' | '1ª Vez' | '2ª Vez' | '+ de 2'

export interface Inscrito {
  id: string
  nome: string
  genero: Genero
  tipo: TipoInscricao
  idade: number | null
  dataNascimento: string
  /** Valor da inscrição travado no momento do cadastro (preços por lote). Null
   *  em inscrições antigas → o app usa o valor atual do evento como fallback. */
  valor?: number | null
  /** Para convidados: 1ª, 2ª ou + de 2 vezes. */
  vez: Vez
  lider: string
  /** Prédio de origem e condução informados na inscrição. */
  predio: string
  conducao: string
  forma: FormaPagamento
  tel: string
  statusInscricao: StatusInscricao
  cancelInfo: string
  pagamentos: Pagamento[]
  comprovante: boolean
  /** id do arquivo de comprovante no backend (bytea), se houver. */
  comprovanteId: string | null
  quarto: string | null
  /** Data/hora (ISO) em que a inscrição foi feita. */
  criadoEm: string
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
  id: string
  nome: string
  inicio: string
  fim: string
  valor: number
  max: number
  /** Total de oferta recebida no retiro (abatido nas inscrições). */
  oferta: number
  /** Local do retiro e ponto de saída — exibidos no formulário público. */
  local: string
  saida: string
  /** 'retiro' usa o template fixo; 'avulso' usa a descrição livre. */
  tipo: TipoEvento
  descricao: string
  /** Link de pagamento (cartão/checkout) exibido no formulário público. */
  linkPagamento: string
  /** Controlam quais campos aparecem no formulário público de inscrição. */
  mostrarLider: boolean
  mostrarPredio: boolean
  mostrarConducao: boolean
  aberto: boolean
  slug: string
  /** id do arquivo (banner) exibido no formulário público. */
  bannerId: string | null
  criadoEm: string
}

/** Líder de um retiro, vinculado a um prédio (nome). */
export interface Lider {
  nome: string
  predio: string
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
  local: string
  saida: string
  tipoEvento: TipoEvento
  descricao: string
  linkPagamento: string
  bannerId: string | null
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
export interface ModalOferta {
  type: 'oferta'
  valor: string
}
export interface ModalDetalhes {
  type: 'detalhes'
  pid: string
}
export interface ModalEditarInscricao {
  type: 'editarInscricao'
  pid: string
  nome: string
  tel: string
  genero: Genero | ''
  idade: string
  dataNascimento: string
  valor: string
  tipo: TipoInscricao
  vez: Vez
  lider: string
  predio: string
  conducao: string
  forma: FormaPagamento
}
/** Edição dos lançamentos de pagamento de uma inscrição (somente ADM). */
export interface ModalEditarPagamento {
  type: 'editarPagamento'
  pid: string
  linhas: Pagamento[]
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
  | ModalOferta
  | ModalDetalhes
  | ModalEditarInscricao
  | ModalEditarPagamento
  | ModalFecharConta
  | ModalEditarConta
  | null

// ---- Loja (por evento) ------------------------------------------------------
export type LojaCategoria = 'vestimenta' | 'outros'

export interface LojaProduto {
  id: string
  retiroId: string | null
  categoria: LojaCategoria
  nome: string
  descricao: string
  valor: number
  /** Link de pagamento (cartão) exibido quando o comprador escolhe Cartão. */
  linkPagamento: string
  /** ids de arquivos (fotos do produto, até 4). */
  fotos: string[]
  ativo: boolean
  criadoEm: string
}

export interface LojaPedido {
  id: string
  retiroId: string | null
  produtoId: string | null
  produtoNome: string
  categoria: LojaCategoria
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

/** Estado global da aplicação. */
export interface AppState {
  narrow: boolean
  sbOpen: boolean
  retiro: Retiro
  lideres: Lider[]
  predios: string[]
  conducoes: string[]
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

/** Conteúdo fixo e dados de pagamento do formulário público de inscrição. */
export interface FormularioConfig {
  subtitulo: string
  descricao: string
  incluidos: string[]
  versiculo: string
  versiculoRef: string
  /** Pagamento (fixo da igreja). */
  pixChave: string
  pixInfo: string
  /** Caminho de asset estático do QR Code (em /public); vazio = não exibe. */
  qrCodeUrl: string
  /** Link de pagamento por cartão (débito/crédito); vazio = não exibe. */
  linkPagamento: string
}

/** Configurações do app (equivalentes aos "props" do protótipo original). */
export interface AppConfig {
  nomeIgreja: string
  nomeIgrejaCompleto: string
  logoUrl: string
  modoCompacto: boolean
  formulario: FormularioConfig
}
