CREATE TABLE "loja_pedidos" (
	"id" text PRIMARY KEY NOT NULL,
	"retiro_id" text,
	"produto_id" text,
	"produto_nome" text DEFAULT '' NOT NULL,
	"categoria" text DEFAULT 'outros' NOT NULL,
	"nome" text DEFAULT '' NOT NULL,
	"genero" text DEFAULT '' NOT NULL,
	"tamanho" text DEFAULT '' NOT NULL,
	"quantidade" integer DEFAULT 1 NOT NULL,
	"valor_unit" double precision DEFAULT 0 NOT NULL,
	"valor_total" double precision DEFAULT 0 NOT NULL,
	"forma" text DEFAULT '' NOT NULL,
	"comprovante" boolean DEFAULT false NOT NULL,
	"comprovante_id" text,
	"status" text DEFAULT 'pendente' NOT NULL,
	"criado_em" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loja_produtos" (
	"id" text PRIMARY KEY NOT NULL,
	"retiro_id" text,
	"categoria" text DEFAULT 'outros' NOT NULL,
	"nome" text NOT NULL,
	"descricao" text DEFAULT '' NOT NULL,
	"valor" double precision DEFAULT 0 NOT NULL,
	"fotos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "loja_pedidos" ADD CONSTRAINT "loja_pedidos_retiro_id_retiros_id_fk" FOREIGN KEY ("retiro_id") REFERENCES "public"."retiros"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loja_pedidos" ADD CONSTRAINT "loja_pedidos_produto_id_loja_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."loja_produtos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loja_produtos" ADD CONSTRAINT "loja_produtos_retiro_id_retiros_id_fk" FOREIGN KEY ("retiro_id") REFERENCES "public"."retiros"("id") ON DELETE cascade ON UPDATE no action;