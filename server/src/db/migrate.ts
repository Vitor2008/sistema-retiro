// Entrypoint do script `npm run db:migrate` — aplica as migrações e encerra.
import { runMigrations } from './migrator.js'

await runMigrations()
