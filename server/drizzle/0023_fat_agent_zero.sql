CREATE TABLE "coordenacoes" (
	"id" text PRIMARY KEY NOT NULL,
	"retiro_id" text,
	"area" text NOT NULL,
	"servo_id" text,
	"obrigacoes" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "coordenacoes" ADD CONSTRAINT "coordenacoes_retiro_id_retiros_id_fk" FOREIGN KEY ("retiro_id") REFERENCES "public"."retiros"("id") ON DELETE cascade ON UPDATE no action;