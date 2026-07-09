// Aplica as migrações geradas pelo drizzle-kit (pasta ./drizzle) ao banco.
// Usado tanto pelo script `npm run db:migrate` quanto pelo start do servidor.
import { fileURLToPath } from 'node:url'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import pg from 'pg'
import { env } from '../env.js'

// Resolve a pasta de migrações relativa a ESTE arquivo (não ao CWD), então
// funciona tanto rodando via tsx (src/db) quanto compilado (dist/db) — ambos
// ficam dois níveis abaixo da pasta `server`, onde vive `drizzle/`.
const MIGRATIONS_FOLDER = fileURLToPath(new URL('../../drizzle', import.meta.url))

export async function runMigrations(): Promise<void> {
  const pool = new pg.Pool({
    connectionString: env.databaseUrl,
    ssl: { rejectUnauthorized: false },
  })
  const db = drizzle(pool)
  try {
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER })
    console.log('Migrações aplicadas com sucesso.')
  } finally {
    await pool.end()
  }
}
