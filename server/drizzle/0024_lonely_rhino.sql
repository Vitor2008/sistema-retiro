CREATE TABLE "coordenacao_areas" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"obrigacoes" text DEFAULT '' NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL
);
