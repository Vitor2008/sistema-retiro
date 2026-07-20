ALTER TABLE "categorias" ADD COLUMN "retiro_id" text;--> statement-breakpoint
ALTER TABLE "conducoes" ADD COLUMN "retiro_id" text;--> statement-breakpoint
ALTER TABLE "despesas" ADD COLUMN "retiro_id" text;--> statement-breakpoint
ALTER TABLE "inscritos" ADD COLUMN "retiro_id" text;--> statement-breakpoint
ALTER TABLE "lideres" ADD COLUMN "retiro_id" text;--> statement-breakpoint
ALTER TABLE "lideres" ADD COLUMN "predio" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "predios" ADD COLUMN "retiro_id" text;--> statement-breakpoint
ALTER TABLE "produtos" ADD COLUMN "retiro_id" text;--> statement-breakpoint
ALTER TABLE "quartos" ADD COLUMN "retiro_id" text;--> statement-breakpoint
ALTER TABLE "retiros" ADD COLUMN "criado_em" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "predio_id" integer;--> statement-breakpoint
ALTER TABLE "vendas" ADD COLUMN "retiro_id" text;--> statement-breakpoint
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_retiro_id_retiros_id_fk" FOREIGN KEY ("retiro_id") REFERENCES "public"."retiros"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conducoes" ADD CONSTRAINT "conducoes_retiro_id_retiros_id_fk" FOREIGN KEY ("retiro_id") REFERENCES "public"."retiros"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "despesas" ADD CONSTRAINT "despesas_retiro_id_retiros_id_fk" FOREIGN KEY ("retiro_id") REFERENCES "public"."retiros"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inscritos" ADD CONSTRAINT "inscritos_retiro_id_retiros_id_fk" FOREIGN KEY ("retiro_id") REFERENCES "public"."retiros"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lideres" ADD CONSTRAINT "lideres_retiro_id_retiros_id_fk" FOREIGN KEY ("retiro_id") REFERENCES "public"."retiros"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predios" ADD CONSTRAINT "predios_retiro_id_retiros_id_fk" FOREIGN KEY ("retiro_id") REFERENCES "public"."retiros"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_retiro_id_retiros_id_fk" FOREIGN KEY ("retiro_id") REFERENCES "public"."retiros"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quartos" ADD CONSTRAINT "quartos_retiro_id_retiros_id_fk" FOREIGN KEY ("retiro_id") REFERENCES "public"."retiros"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_predio_id_predios_id_fk" FOREIGN KEY ("predio_id") REFERENCES "public"."predios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_retiro_id_retiros_id_fk" FOREIGN KEY ("retiro_id") REFERENCES "public"."retiros"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
UPDATE "retiros" SET "criado_em" = '2020-01-01T00:00:00.000Z' WHERE "criado_em" = '' OR "criado_em" IS NULL;--> statement-breakpoint
UPDATE "inscritos" SET "retiro_id" = 'atual' WHERE "retiro_id" IS NULL;--> statement-breakpoint
UPDATE "quartos" SET "retiro_id" = 'atual' WHERE "retiro_id" IS NULL;--> statement-breakpoint
UPDATE "produtos" SET "retiro_id" = 'atual' WHERE "retiro_id" IS NULL;--> statement-breakpoint
UPDATE "vendas" SET "retiro_id" = 'atual' WHERE "retiro_id" IS NULL;--> statement-breakpoint
UPDATE "despesas" SET "retiro_id" = 'atual' WHERE "retiro_id" IS NULL;--> statement-breakpoint
UPDATE "categorias" SET "retiro_id" = 'atual' WHERE "retiro_id" IS NULL;--> statement-breakpoint
UPDATE "conducoes" SET "retiro_id" = 'atual' WHERE "retiro_id" IS NULL;--> statement-breakpoint
UPDATE "lideres" SET "retiro_id" = 'atual' WHERE "retiro_id" IS NULL;--> statement-breakpoint
UPDATE "predios" SET "retiro_id" = 'atual' WHERE "retiro_id" IS NULL;