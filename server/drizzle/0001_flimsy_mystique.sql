CREATE TABLE "arquivos" (
	"id" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"mime" text DEFAULT 'application/octet-stream' NOT NULL,
	"tamanho" integer DEFAULT 0 NOT NULL,
	"dados" "bytea" NOT NULL,
	"criado_em" text DEFAULT '' NOT NULL
);
