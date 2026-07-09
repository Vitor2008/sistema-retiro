CREATE TABLE "conducoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "predios" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inscritos" ADD COLUMN "idade" integer;--> statement-breakpoint
ALTER TABLE "inscritos" ADD COLUMN "data_nascimento" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "inscritos" ADD COLUMN "vez" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "inscritos" ADD COLUMN "predio" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "inscritos" ADD COLUMN "conducao" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "retiros" ADD COLUMN "local" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "retiros" ADD COLUMN "saida" text DEFAULT '' NOT NULL;