ALTER TABLE "retiros" ADD COLUMN "predios_participantes" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
-- Backfill: participação por evento vem das linhas atuais da tabela predios.
UPDATE "retiros" r SET "predios_participantes" = COALESCE(
  (SELECT jsonb_agg(DISTINCT p."nome") FROM "predios" p WHERE p."retiro_id" = r."id"),
  '[]'::jsonb
);--> statement-breakpoint
-- Catálogo global: dedup por nome, preservando o vínculo de usuários.
UPDATE "usuarios" u SET "predio_id" = (
  SELECT MIN(p2."id") FROM "predios" p2
  WHERE p2."nome" = (SELECT p1."nome" FROM "predios" p1 WHERE p1."id" = u."predio_id")
) WHERE u."predio_id" IS NOT NULL;--> statement-breakpoint
DELETE FROM "predios" a USING "predios" b WHERE a."nome" = b."nome" AND a."id" > b."id";--> statement-breakpoint
UPDATE "predios" SET "retiro_id" = NULL;