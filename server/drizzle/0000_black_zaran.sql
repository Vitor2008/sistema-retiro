CREATE TABLE "categorias" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "despesas" (
	"id" text PRIMARY KEY NOT NULL,
	"categoria" text DEFAULT '' NOT NULL,
	"descricao" text DEFAULT '' NOT NULL,
	"valor" double precision DEFAULT 0 NOT NULL,
	"anexo" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "escalas" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb
);
--> statement-breakpoint
CREATE TABLE "inscritos" (
	"id" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"genero" text NOT NULL,
	"tipo" text NOT NULL,
	"dia_servir" text DEFAULT '' NOT NULL,
	"lider" text DEFAULT '' NOT NULL,
	"forma" text DEFAULT '' NOT NULL,
	"parcelas" integer,
	"tel" text DEFAULT '' NOT NULL,
	"status_inscricao" text DEFAULT 'pendente' NOT NULL,
	"cancel_info" text DEFAULT '' NOT NULL,
	"comprovante" boolean DEFAULT false NOT NULL,
	"quarto" text
);
--> statement-breakpoint
CREATE TABLE "lideres" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pagamentos" (
	"id" serial PRIMARY KEY NOT NULL,
	"inscrito_id" text NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	"valor" double precision DEFAULT 0 NOT NULL,
	"oferta" double precision DEFAULT 0 NOT NULL,
	"forma" text DEFAULT '' NOT NULL,
	"obs" text DEFAULT '' NOT NULL,
	"data" text DEFAULT '' NOT NULL,
	"usuario" text DEFAULT '' NOT NULL,
	"data_prevista" text
);
--> statement-breakpoint
CREATE TABLE "produtos" (
	"id" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"valor" double precision DEFAULT 0 NOT NULL,
	"estoque" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quartos" (
	"id" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"genero" text NOT NULL,
	"cap" integer DEFAULT 0 NOT NULL,
	"lideres" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "retiros" (
	"id" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"inicio" text DEFAULT '' NOT NULL,
	"fim" text DEFAULT '' NOT NULL,
	"valor" double precision DEFAULT 0 NOT NULL,
	"max" integer DEFAULT 0 NOT NULL,
	"aberto" boolean DEFAULT true NOT NULL,
	"slug" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "retiros_passados" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"periodo" text DEFAULT '' NOT NULL,
	"inscritos" integer DEFAULT 0 NOT NULL,
	"max" integer DEFAULT 0 NOT NULL,
	"arrecadado" double precision DEFAULT 0 NOT NULL,
	"saldo" double precision DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venda_itens" (
	"id" serial PRIMARY KEY NOT NULL,
	"venda_id" text NOT NULL,
	"item_id" text NOT NULL,
	"nome" text NOT NULL,
	"valor" double precision DEFAULT 0 NOT NULL,
	"qtd" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendas" (
	"id" text PRIMARY KEY NOT NULL,
	"tipo" text NOT NULL,
	"cliente" text DEFAULT '' NOT NULL,
	"forma" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'pago' NOT NULL,
	"data" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_inscrito_id_inscritos_id_fk" FOREIGN KEY ("inscrito_id") REFERENCES "public"."inscritos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venda_itens" ADD CONSTRAINT "venda_itens_venda_id_vendas_id_fk" FOREIGN KEY ("venda_id") REFERENCES "public"."vendas"("id") ON DELETE cascade ON UPDATE no action;