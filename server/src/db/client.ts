import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import { env } from '../env.js'
import * as schema from './schema.js'

/** Pool de conexões Postgres (Neon exige SSL). O pooler da Neon aceita o
 *  protocolo padrão do Postgres, então usamos node-postgres. */
export const pool = new pg.Pool({
  connectionString: env.databaseUrl,
  ssl: { rejectUnauthorized: false },
  max: 10,
})

export const db = drizzle(pool, { schema })

export type DB = typeof db
