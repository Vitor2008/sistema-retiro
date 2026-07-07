// ============================================================================
// Modelagem relacional (Drizzle ORM). Espelha o domínio do frontend.
// Valores monetários usam doublePrecision por simplicidade; em produção o
// ideal seria inteiro em centavos.
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

/** Retiro atual (configuração única, id fixo 'atual'). */
export const retiros = pgTable('retiros', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  inicio: text('inicio').notNull().default(''),
  fim: text('fim').notNull().default(''),
  valor: doublePrecision('valor').notNull().default(0),
  max: integer('max').notNull().default(0),
  aberto: boolean('aberto').notNull().default(true),
  slug: text('slug').notNull().default(''),
})

/** Histórico de retiros passados (resumos). */
export const retirosPassados = pgTable('retiros_passados', {
  id: serial('id').primaryKey(),
  nome: text('nome').notNull(),
  periodo: text('periodo').notNull().default(''),
  inscritos: integer('inscritos').notNull().default(0),
  max: integer('max').notNull().default(0),
  arrecadado: doublePrecision('arrecadado').notNull().default(0),
  saldo: doublePrecision('saldo').notNull().default(0),
})

export const lideres = pgTable('lideres', {
  id: serial('id').primaryKey(),
  nome: text('nome').notNull(),
})

export const categorias = pgTable('categorias', {
  id: serial('id').primaryKey(),
  nome: text('nome').notNull(),
})

export const inscritos = pgTable('inscritos', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  genero: text('genero').notNull(),
  tipo: text('tipo').notNull(),
  diaServir: text('dia_servir').notNull().default(''),
  lider: text('lider').notNull().default(''),
  forma: text('forma').notNull().default(''),
  parcelas: integer('parcelas'),
  tel: text('tel').notNull().default(''),
  statusInscricao: text('status_inscricao').notNull().default('pendente'),
  cancelInfo: text('cancel_info').notNull().default(''),
  comprovante: boolean('comprovante').notNull().default(false),
  comprovanteId: text('comprovante_id'),
  quarto: text('quarto'),
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
  nome: text('nome').notNull(),
  genero: text('genero').notNull(),
  cap: integer('cap').notNull().default(0),
  /** ids de inscritos que são líderes do quarto. */
  lideres: jsonb('lideres').$type<string[]>().notNull().default([]),
})

export const produtos = pgTable('produtos', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  valor: doublePrecision('valor').notNull().default(0),
  estoque: integer('estoque').notNull().default(0),
})

export const vendas = pgTable('vendas', {
  id: text('id').primaryKey(),
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

/** Escala de serviço (estrutura aninhada por dia/turno/frente em jsonb). */
export const escalas = pgTable('escalas', {
  id: text('id').primaryKey(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: jsonb('data').$type<Record<string, unknown> | null>(),
})
