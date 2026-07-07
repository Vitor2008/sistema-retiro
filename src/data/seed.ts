import type {
  AppState,
  Despesa,
  FormInscricao,
  Inscrito,
  Produto,
  Quarto,
  Venda,
} from '../types'

/** Estado inicial "de fábrica" — 40 inscritos fictícios + quartos, produtos,
 *  vendas e despesas de exemplo. Espelha o seed() do protótipo original. */
export function seedState(): AppState {
  const lideres = [
    'Pr. Marcos Vieira',
    'Pra. Cláudia Vieira',
    'Roberto Tavares',
    'Simone Prado',
    'Anderson Cruz',
    'Elaine Matos',
    'Fábio Siqueira',
    'Mônica Leal',
  ]

  // [nome, genero, tipo(S/E), diaServir, liderIdx, forma,
  //  pag: 0 pendente | 1 parcial | 2 pago | 3 oferta, quartoIdx|null]
  const raw: Array<
    [string, 'M' | 'F', 'S' | 'E', string, number, string, number, number | null]
  > = [
    ['Ana Beatriz Souza', 'F', 'S', '1º dia', 0, 'Pix', 2, 3],
    ['Carlos Eduardo Lima', 'M', 'S', '1º dia', 2, 'Dinheiro', 2, 0],
    ['Juliana Ferreira', 'F', 'S', '1º dia', 1, 'Pix', 2, 3],
    ['Marcos Paulo Andrade', 'M', 'S', '1º dia', 2, 'Crédito à vista', 2, 0],
    ['Pedro Henrique Rocha', 'M', 'S', '1º dia', 4, 'Pix', 1, 1],
    ['Camila Duarte', 'F', 'S', '1º dia', 3, 'Débito', 2, 4],
    ['Rafael Gonçalves', 'M', 'S', '1º dia', 4, 'Pix', 2, 1],
    ['Fernanda Castro', 'F', 'S', '1º dia', 5, 'Dinheiro', 0, 4],
    ['Thiago Almeida', 'M', 'S', '2º dia', 6, 'Pix', 2, 0],
    ['Larissa Mendes', 'F', 'S', '2º dia', 5, 'Pix', 2, 3],
    ['Bruno Carvalho', 'M', 'S', '2º dia', 6, 'Crédito parcelado', 1, 1],
    ['Patrícia Nunes', 'F', 'S', '2º dia', 7, 'Pix', 2, 4],
    ['Gustavo Ribeiro', 'M', 'S', '2º dia', 2, 'Dinheiro', 0, null],
    ['Aline Barbosa', 'F', 'S', '2º dia', 3, 'Pix', 2, 5],
    ['Diego Martins', 'M', 'S', '2º dia', 4, 'Débito', 2, 2],
    ['Renata Farias', 'F', 'S', '2º dia', 1, 'Pix', 3, 5],
    ['João Vitor Santos', 'M', 'E', '', 0, 'Pix', 2, 0],
    ['Maria Clara Oliveira', 'F', 'E', '', 1, 'Pix', 2, 3],
    ['Lucas Pereira', 'M', 'E', '', 0, 'Dinheiro', 0, null],
    ['Isabela Cardoso', 'F', 'E', '', 1, 'Crédito parcelado', 1, 4],
    ['Mateus Fonseca', 'M', 'E', '', 2, 'Pix', 2, 1],
    ['Gabriela Teixeira', 'F', 'E', '', 3, 'Pix', 0, null],
    ['Felipe Araújo', 'M', 'E', '', 2, 'Débito', 2, 2],
    ['Beatriz Ramos', 'F', 'E', '', 3, 'Pix', 2, 5],
    ['Vinícius Moreira', 'M', 'E', '', 4, 'Pix', 0, null],
    ['Amanda Correia', 'F', 'E', '', 5, 'Dinheiro', 2, 4],
    ['Leonardo Dias', 'M', 'E', '', 4, 'Crédito à vista', 2, 2],
    ['Letícia Campos', 'F', 'E', '', 5, 'Pix', 1, 5],
    ['Rodrigo Batista', 'M', 'E', '', 6, 'Pix', 2, 1],
    ['Natália Freitas', 'F', 'E', '', 7, 'Pix', 2, 3],
    ['Eduardo Pires', 'M', 'E', '', 6, 'Dinheiro', 0, null],
    ['Carolina Sales', 'F', 'E', '', 7, 'Pix', 2, 4],
    ['André Luiz Costa', 'M', 'E', '', 0, 'Pix', 2, 2],
    ['Vanessa Moura', 'F', 'E', '', 1, 'Débito', 0, null],
    ['Henrique Silveira', 'M', 'E', '', 2, 'Pix', 3, 0],
    ['Débora Antunes', 'F', 'E', '', 3, 'Pix', 2, 5],
    ['Otávio Rezende', 'M', 'E', '', 4, 'Crédito parcelado', 1, null],
    ['Priscila Xavier', 'F', 'E', '', 5, 'Pix', 0, null],
    ['Samuel Torres', 'M', 'E', '', 6, 'Pix', 2, null],
    ['Tainá Lopes', 'F', 'E', '', 7, 'Dinheiro', 2, null],
  ]

  const valor = 260
  const inscritos: Inscrito[] = raw.map((r, i) => {
    const pagamentos = []
    if (r[6] === 2)
      pagamentos.push({
        valor,
        oferta: 0,
        forma: r[5],
        obs: '',
        data: '10/07 14:2' + (i % 10),
        usuario: 'Admin',
      })
    if (r[6] === 1)
      pagamentos.push({
        valor: 130,
        oferta: 0,
        forma: r[5],
        obs: 'Pagamento parcial no check-in',
        data: '10/07 15:0' + (i % 10),
        usuario: 'Admin',
        dataPrevista: '2026-07-18',
      })
    if (r[6] === 3)
      pagamentos.push({
        valor: 0,
        oferta: valor,
        forma: 'Oferta',
        obs: 'Abatido via ofertas',
        data: '10/07 16:1' + (i % 10),
        usuario: 'Admin',
      })
    return {
      id: 'p' + i,
      nome: r[0],
      genero: r[1],
      tipo: r[2] === 'S' ? 'Servo' : 'Encontrista',
      diaServir: r[3] as Inscrito['diaServir'],
      lider: lideres[r[4]],
      forma: r[5] as Inscrito['forma'],
      parcelas: r[5] === 'Crédito parcelado' ? 3 : null,
      tel:
        '(64) 9 9' +
        String(100 + i * 7).slice(0, 3) +
        '-' +
        String(1000 + i * 83).slice(0, 4),
      statusInscricao: r[6] > 0 ? 'confirmada' : 'pendente',
      cancelInfo: '',
      pagamentos: pagamentos as Inscrito['pagamentos'],
      comprovante: r[5] === 'Pix',
      comprovanteId: null,
      quarto: r[7] === null ? null : 'q' + r[7],
    }
  })

  // duas canceladas
  inscritos[38].statusInscricao = 'cancelada'
  inscritos[38].pagamentos = []
  inscritos[38].quarto = null
  inscritos[38].cancelInfo = 'Cancelada em 09/07 — desistência'
  inscritos[37].statusInscricao = 'cancelada'
  inscritos[37].pagamentos = []
  inscritos[37].cancelInfo = 'Cancelada em 08/07 — sem contato'

  const quartos: Quarto[] = [
    { id: 'q0', nome: 'Quarto 1 — Hebrom', genero: 'M', cap: 8, lideres: ['p1', 'p3'] },
    { id: 'q1', nome: 'Quarto 2 — Betel', genero: 'M', cap: 8, lideres: ['p4'] },
    { id: 'q2', nome: 'Quarto 3 — Gileade', genero: 'M', cap: 6, lideres: ['p14'] },
    { id: 'q3', nome: 'Quarto 4 — Shalom', genero: 'F', cap: 8, lideres: ['p0', 'p2'] },
    { id: 'q4', nome: 'Quarto 5 — Betânia', genero: 'F', cap: 8, lideres: ['p5'] },
    { id: 'q5', nome: 'Quarto 6 — Hermom', genero: 'F', cap: 6, lideres: ['p13'] },
  ]

  const produtos: Produto[] = [
    { id: 'pr0', nome: 'Água mineral', valor: 3, estoque: 48 },
    { id: 'pr1', nome: 'Refrigerante lata', valor: 6, estoque: 32 },
    { id: 'pr2', nome: 'Suco de caixinha', valor: 5, estoque: 24 },
    { id: 'pr3', nome: 'Chocolate', valor: 4, estoque: 18 },
    { id: 'pr4', nome: 'Salgadinho', valor: 5, estoque: 22 },
    { id: 'pr5', nome: 'Bala / chiclete', valor: 1, estoque: 90 },
    { id: 'pr6', nome: 'Fatia de bolo', valor: 6, estoque: 12 },
    { id: 'pr7', nome: 'Café', valor: 2, estoque: 60 },
    { id: 'pr8', nome: 'Sanduíche natural', valor: 8, estoque: 10 },
    { id: 'pr9', nome: 'Picolé', valor: 4, estoque: 3 },
  ]

  const vendas: Venda[] = [
    {
      id: 'v0',
      tipo: 'avulsa',
      cliente: '',
      forma: 'Pix',
      status: 'pago',
      data: '11/07 09:12',
      itens: [
        { id: 'pr0', nome: 'Água mineral', valor: 3, qtd: 2 },
        { id: 'pr3', nome: 'Chocolate', valor: 4, qtd: 1 },
      ],
    },
    {
      id: 'v1',
      tipo: 'avulsa',
      cliente: '',
      forma: 'Dinheiro',
      status: 'pago',
      data: '11/07 10:40',
      itens: [
        { id: 'pr7', nome: 'Café', valor: 2, qtd: 3 },
        { id: 'pr6', nome: 'Fatia de bolo', valor: 6, qtd: 2 },
      ],
    },
    {
      id: 'v2',
      tipo: 'anotada',
      cliente: 'Lucas Pereira',
      forma: '',
      status: 'pendente',
      data: '11/07 11:05',
      itens: [
        { id: 'pr1', nome: 'Refrigerante lata', valor: 6, qtd: 2 },
        { id: 'pr4', nome: 'Salgadinho', valor: 5, qtd: 1 },
      ],
    },
    {
      id: 'v3',
      tipo: 'anotada',
      cliente: 'Simone Prado',
      forma: '',
      status: 'pendente',
      data: '11/07 12:30',
      itens: [
        { id: 'pr8', nome: 'Sanduíche natural', valor: 8, qtd: 1 },
        { id: 'pr0', nome: 'Água mineral', valor: 3, qtd: 1 },
      ],
    },
  ]

  const despesas: Despesa[] = [
    {
      id: 'd0',
      categoria: 'Alimentação',
      descricao: 'Hortifruti e açougue — 3 dias',
      valor: 1840,
      anexo: 'nota-hortifruti.pdf',
      anexoId: '',
    },
    {
      id: 'd1',
      categoria: 'Alimentação',
      descricao: 'Padaria — cafés da manhã',
      valor: 420,
      anexo: 'nf-padaria.jpg',
      anexoId: '',
    },
    {
      id: 'd2',
      categoria: 'Material',
      descricao: 'Apostilas e crachás',
      valor: 310,
      anexo: 'nf-grafica.pdf',
      anexoId: '',
    },
    {
      id: 'd3',
      categoria: 'Transporte',
      descricao: 'Combustível van',
      valor: 280,
      anexo: '',
      anexoId: '',
    },
  ]

  return {
    narrow: false,
    sbOpen: true,
    retiro: {
      nome: 'Retiro Renovo — 42ª edição',
      inicio: '2026-07-17',
      fim: '2026-07-19',
      valor,
      max: 45,
      aberto: true,
      slug: 'renovo-42',
    },
    retirosPassados: [
      {
        nome: 'Retiro Renovo — 41ª edição',
        periodo: '12–14 jun 2026',
        inscritos: 44,
        max: 44,
        arrecadado: 11440,
        saldo: 2180,
      },
      {
        nome: 'Retiro Renovo — 40ª edição',
        periodo: '15–17 mai 2026',
        inscritos: 41,
        max: 44,
        arrecadado: 10660,
        saldo: 1590,
      },
    ],
    lideres,
    inscritos,
    quartos,
    produtos,
    vendas,
    despesas,
    categorias: [
      'Alimentação',
      'Material',
      'Transporte',
      'Limpeza',
      'Hospedagem',
      'Outros',
    ],
    escala: null,
    escalaDia: 'd1',
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
