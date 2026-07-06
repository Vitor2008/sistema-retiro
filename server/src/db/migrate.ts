// Aplica as migrações geradas pelo drizzle-kit (pasta ./drizzle) ao banco.
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import pg from 'pg'
import { env } from '../env.js'

const pool = new pg.Pool({
  connectionString: env.databaseUrl,
  ssl: { rejectUnauthorized: false },
})

const db = drizzle(pool)

await migrate(db, { migrationsFolder: './drizzle' })
console.log('Migrações aplicadas com sucesso.')
await pool.end()
