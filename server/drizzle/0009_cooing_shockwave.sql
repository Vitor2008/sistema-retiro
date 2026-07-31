ALTER TABLE "retiros" ADD COLUMN "tipo" text DEFAULT 'retiro' NOT NULL;--> statement-breakpoint
ALTER TABLE "retiros" ADD COLUMN "descricao" text DEFAULT '' NOT NULL;