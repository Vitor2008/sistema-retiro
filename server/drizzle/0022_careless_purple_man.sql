CREATE TABLE "cantina_catalogo" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"valor" double precision DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "produtos" ADD COLUMN "catalogo_id" integer;--> statement-breakpoint
ALTER TABLE "produtos" ADD COLUMN "ativo" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_catalogo_id_cantina_catalogo_id_fk" FOREIGN KEY ("catalogo_id") REFERENCES "public"."cantina_catalogo"("id") ON DELETE set null ON UPDATE no action;