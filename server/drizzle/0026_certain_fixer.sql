ALTER TABLE "inscritos" ADD COLUMN "cortesia" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "inscritos" ADD COLUMN "cortesia_motivo" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "inscritos" ADD COLUMN "presente" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "inscritos" ADD COLUMN "excluido_em" text;