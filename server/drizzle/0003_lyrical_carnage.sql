CREATE TABLE "usuarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"senha_hash" text NOT NULL,
	"nome" text DEFAULT '' NOT NULL,
	"role" text DEFAULT 'admin' NOT NULL,
	"criado_em" text DEFAULT '' NOT NULL,
	CONSTRAINT "usuarios_username_unique" UNIQUE("username")
);
