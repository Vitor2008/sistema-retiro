// ============================================================================
// Modelagem relacional (Drizzle ORM). Espelha o domínio do frontend.
// Valores monetários usam doublePrecision por simplicidade; em produção o
// ideal seria inteiro em centavos.
//
// Multi-retiro: quase tudo é escopado por `retiro_id`. O retiro deixou de ser
// singleton ('atual'); agora há vários. Prédios são persistentes (usuários
// pertencem a eles) e cada um participa de um retiro por vez (predios.retiroId).
// ============================================================================

import {
  boolean,
  customType,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
} from 'drizzle-orm/pg-core'

/** Tipo bytea (conteúdo binário) mapeado para Buffer. */
const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return 'bytea'
  },
})

/** Retiros (multi-registro). O id 'atual' legado vira o "retiro inicial". */
export const retiros = pgTable('retiros', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  inicio: text('inicio').notNull().default(''),
  fim: text('fim').notNull().default(''),
  valor: doublePrecision('valor').notNull().default(0),
  max: integer('max').notNull().default(0),
  /** Total de oferta recebida no retiro (usado para abater inscrições). */
  oferta: doublePrecision('oferta').notNull().default(0),
  /** Local do retiro e ponto de saída — exibidos no formulário público. */
  local: text('local').notNull().default(''),
  saida: text('saida').notNull().default(''),
  /** Tipo do evento: 'retiro' (template fixo) ou 'avulso' (descrição livre). */
  tipo: text('tipo').notNull().default('retiro'),
  /** Descrição livre exibida no formulário quando o evento é avulso. */
  descricao: text('descricao').notNull().default(''),
  /** Link de pagamento (cartão/checkout) exibido no formulário público. */
  linkPagamento: text('link_pagamento').notNull().default(''),
  /** Controla quais campos aparecem no formulário público de inscrição. */
  mostrarLider: boolean('mostrar_lider').notNull().default(true),
  mostrarPredio: boolean('mostrar_predio').notNull().default(true),
  mostrarConducao: boolean('mostrar_conducao').notNull().default(true),
  /** Nomes dos prédios (do catálogo) que participam deste evento. */
  prediosParticipantes: jsonb('predios_participantes').$type<string[]>().notNull().default([]),
  aberto: boolean('aberto').notNull().default(true),
  /** Slug único para o link público de inscrição. */
  slug: text('slug').notNull().default(''),
  /** id do arquivo (bytea) usado como banner no formulário público, se houver. */
  bannerId: text('banner_id'),
  /** Data de criação (ISO) — usada para ordenar a lista de retiros. */
  criadoEm: text('criado_em').notNull().default(''),
})

/** Histórico de retiros passados (legado; não mais alimentado no multi-retiro). */
export const retirosPassados = pgTable('retiros_passados', {
  id: serial('id').primaryKey(),
  nome: text('nome').notNull(),
  periodo: text('periodo').notNull().default(''),
  inscritos: integer('inscritos').notNull().default(0),
  max: integer('max').notNull().default(0),
  arrecadado: doublePrecision('arrecadado').notNull().default(0),
  saldo: doublePrecision('saldo').notNull().default(0),
})

/** Prédios (igrejas/edifícios). Persistentes; cada um participa de um retiro
 *  por vez (retiroId). Usuários pertencem a um prédio. */
export const predios = pgTable('predios', {
  id: serial('id').primaryKey(),
  nome: text('nome').notNull(),
  retiroId: text('retiro_id').references(() => retiros.id, { onDelete: 'set null' }),
})

/** Líderes — por retiro e por prédio (recadastrados a cada retiro). O prédio é
 *  guardado por nome (denormalizado), como em `inscritos.predio`. */
export const lideres = pgTable('lideres', {
  id: serial('id').primaryKey(),
  nome: text('nome').notNull(),
  retiroId: text('retiro_id').references(() => retiros.id, { onDelete: 'cascade' }),
  predio: text('predio').notNull().default(''),
})

/** Categorias de despesa — por retiro. */
export const categorias = pgTable('categorias', {
  id: serial('id').primaryKey(),
  nome: text('nome').notNull(),
  retiroId: text('retiro_id').references(() => retiros.id, { onDelete: 'cascade' }),
})

/** Opções de condução (transporte) — por retiro. */
export const conducoes = pgTable('conducoes', {
  id: serial('id').primaryKey(),
  nome: text('nome').notNull(),
  retiroId: text('retiro_id').references(() => retiros.id, { onDelete: 'cascade' }),
})

export const inscritos = pgTable('inscritos', {
  id: text('id').primaryKey(),
  retiroId: text('retiro_id').references(() => retiros.id, { onDelete: 'cascade' }),
  nome: text('nome').notNull(),
  genero: text('genero').notNull(),
  tipo: text('tipo').notNull(),
  /** Idade e data de nascimento informadas na inscrição. */
  idade: integer('idade'),
  dataNascimento: text('data_nascimento').notNull().default(''),
  /** Valor da inscrição no momento do cadastro (preços por lote). Nulo em
   *  inscrições legadas → o app usa o valor atual do evento como fallback. */
  valor: doublePrecision('valor'),
  /** Para convidados: 1ª vez, 2ª vez ou + de 2. */
  vez: text('vez').notNull().default(''),
  lider: text('lider').notNull().default(''),
  /** Prédio de origem e forma de condução até o retiro. */
  predio: text('predio').notNull().default(''),
  conducao: text('conducao').notNull().default(''),
  forma: text('forma').notNull().default(''),
  // Legado (não mais usado pelo app; mantido para não apagar dados existentes).
  diaServir: text('dia_servir').notNull().default(''),
  parcelas: integer('parcelas'),
  tel: text('tel').notNull().default(''),
  statusInscricao: text('status_inscricao').notNull().default('pendente'),
  cancelInfo: text('cancel_info').notNull().default(''),
  comprovante: boolean('comprovante').notNull().default(false),
  comprovanteId: text('comprovante_id'),
  quarto: text('quarto'),
  /** Data/hora (ISO) em que a inscrição foi feita. */
  criadoEm: text('criado_em').notNull().default(''),
})

/** Lançamentos de pagamento (filhos de inscritos). */
export const pagamentos = pgTable('pagamentos', {
  id: serial('id').primaryKey(),
  inscritoId: text('inscrito_id')
    .notNull()
    .references(() => inscritos.id, { onDelete: 'cascade' }),
  ordem: integer('ordem').notNull().default(0),
  valor: doublePrecision('valor').notNull().default(0),
  oferta: doublePrecision('oferta').notNull().default(0),
  forma: text('forma').notNull().default(''),
  obs: text('obs').notNull().default(''),
  data: text('data').notNull().default(''),
  usuario: text('usuario').notNull().default(''),
  dataPrevista: text('data_prevista'),
})

export const quartos = pgTable('quartos', {
  id: text('id').primaryKey(),
  retiroId: text('retiro_id').references(() => retiros.id, { onDelete: 'cascade' }),
  nome: text('nome').notNull(),
  genero: text('genero').notNull(),
  cap: integer('cap').notNull().default(0),
  /** ids de inscritos que são líderes do quarto. */
  lideres: jsonb('lideres').$type<string[]>().notNull().default([]),
})

export const produtos = pgTable('produtos', {
  id: text('id').primaryKey(),
  retiroId: text('retiro_id').references(() => retiros.id, { onDelete: 'cascade' }),
  nome: text('nome').notNull(),
  valor: doublePrecision('valor').notNull().default(0),
  estoque: integer('estoque').notNull().default(0),
})

export const vendas = pgTable('vendas', {
  id: text('id').primaryKey(),
  retiroId: text('retiro_id').references(() => retiros.id, { onDelete: 'cascade' }),
  tipo: text('tipo').notNull(),
  cliente: text('cliente').notNull().default(''),
  forma: text('forma').notNull().default(''),
  status: text('status').notNull().default('pago'),
  data: text('data').notNull().default(''),
})

/** Itens de venda (filhos de vendas). */
export const vendaItens = pgTable('venda_itens', {
  id: serial('id').primaryKey(),
  vendaId: text('venda_id')
    .notNull()
    .references(() => vendas.id, { onDelete: 'cascade' }),
  itemId: text('item_id').notNull(),
  nome: text('nome').notNull(),
  valor: doublePrecision('valor').notNull().default(0),
  qtd: integer('qtd').notNull().default(0),
})

export const despesas = pgTable('despesas', {
  id: text('id').primaryKey(),
  retiroId: text('retiro_id').references(() => retiros.id, { onDelete: 'cascade' }),
  categoria: text('categoria').notNull().default(''),
  descricao: text('descricao').notNull().default(''),
  valor: doublePrecision('valor').notNull().default(0),
  anexo: text('anexo').notNull().default(''),
  anexoId: text('anexo_id').notNull().default(''),
})

/** Usuários do sistema (autenticação). Senha guardada como hash bcrypt. */
export const usuarios = pgTable('usuarios', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  senhaHash: text('senha_hash').notNull(),
  nome: text('nome').notNull().default(''),
  role: text('role').notNull().default('admin'),
  /** Tipos de acesso do usuário: adm | financeiro | cantina | quarto | servico */
  acessos: jsonb('acessos').$type<string[]>().notNull().default([]),
  /** Prédio ao qual o usuário pertence (define o retiro que ele enxerga). */
  predioId: integer('predio_id').references(() => predios.id, { onDelete: 'set null' }),
  criadoEm: text('criado_em').notNull().default(''),
})

/** Comprovantes/notas (imagens/PDF) armazenados como bytea no próprio banco. */
export const arquivos = pgTable('arquivos', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  mime: text('mime').notNull().default('application/octet-stream'),
  tamanho: integer('tamanho').notNull().default(0),
  dados: bytea('dados').notNull(),
  criadoEm: text('criado_em').notNull().default(''),
})

/** Escala de serviço por retiro (id da linha = id do retiro). Estrutura
 *  aninhada por dia/turno/frente em jsonb. */
export const escalas = pgTable('escalas', {
  id: text('id').primaryKey(),
  data: jsonb('data').$type<Record<string, unknown> | null>(),
})

/** Loja — produtos à venda por evento (camisetas etc.). Categoria define o
 *  formulário público: 'vestimenta' pede nome/gênero/tamanho; 'outros' não. */
export const lojaProdutos = pgTable('loja_produtos', {
  id: text('id').primaryKey(),
  retiroId: text('retiro_id').references(() => retiros.id, { onDelete: 'cascade' }),
  categoria: text('categoria').notNull().default('outros'),
  nome: text('nome').notNull(),
  descricao: text('descricao').notNull().default(''),
  valor: doublePrecision('valor').notNull().default(0),
  /** ids de arquivos (bytea) usados como fotos do produto (até 4). */
  fotos: jsonb('fotos').$type<string[]>().notNull().default([]),
  ativo: boolean('ativo').notNull().default(true),
  criadoEm: text('criado_em').notNull().default(''),
})

/** Loja — pedidos feitos pelo público. Dados do produto são denormalizados
 *  para preservar o histórico mesmo se o produto for excluído. */
export const lojaPedidos = pgTable('loja_pedidos', {
  id: text('id').primaryKey(),
  retiroId: text('retiro_id').references(() => retiros.id, { onDelete: 'cascade' }),
  produtoId: text('produto_id').references(() => lojaProdutos.id, { onDelete: 'set null' }),
  produtoNome: text('produto_nome').notNull().default(''),
  categoria: text('categoria').notNull().default('outros'),
  nome: text('nome').notNull().default(''),
  genero: text('genero').notNull().default(''),
  tamanho: text('tamanho').notNull().default(''),
  quantidade: integer('quantidade').notNull().default(1),
  valorUnit: doublePrecision('valor_unit').notNull().default(0),
  valorTotal: doublePrecision('valor_total').notNull().default(0),
  forma: text('forma').notNull().default(''),
  comprovante: boolean('comprovante').notNull().default(false),
  comprovanteId: text('comprovante_id'),
  status: text('status').notNull().default('pendente'),
  criadoEm: text('criado_em').notNull().default(''),
})
