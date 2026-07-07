import type { AppState, FormInscricao } from '../types'

/** Estado inicial limpo (produção): sem dados fictícios. O administrador
 *  configura o retiro, cadastra líderes e o restante pela aplicação. */
export function seedState(): AppState {
  return {
    narrow: false,
    sbOpen: true,
    retiro: {
      nome: 'Novo retiro',
      inicio: '',
      fim: '',
      valor: 0,
      max: 0,
      aberto: false,
      slug: 'novo-retiro',
    },
    retirosPassados: [],
    lideres: [],
    inscritos: [],
    quartos: [],
    produtos: [],
    vendas: [],
    despesas: [],
    categorias: [
      'Alimentação',
      'Material',
      'Transporte',
      'Limpeza',
      'Hospedagem',
      'Outros',
    ],
    escala: null,
    escalaDia: 'sexta',
    ciBusca: '',
    ciTipo: 'todos',
    ciPag: 'todos',
    qGenero: 'M',
    dragId: null,
    selId: null,
    form: seedForm(),
    carrinho: [],
    vendaTipo: 'avulsa',
    vendaForma: 'Dinheiro',
    vCliente: '',
    cantinaTab: 'venda',
    modal: null,
    toast: null,
  }
}

export function seedForm(): FormInscricao {
  return {
    nome: '',
    tel: '',
    genero: '',
    tipo: 'Encontrista',
    dia: '',
    lider: '',
    forma: '',
    parcelas: '3',
    comprovante: null,
    erros: {},
    enviado: false,
  }
}
