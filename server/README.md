# Sistema de Retiros — Backend (API + Postgres/Neon)

API REST em **Node + Express + TypeScript**, com **Drizzle ORM** sobre
**Postgres (Neon)**. Organizado em camadas:

```
server/src/
├─ env.ts                 # variáveis de ambiente (dotenv)
├─ db/
│  ├─ schema.ts           # tabelas Drizzle (todas as entidades)
│  ├─ client.ts           # Pool pg + drizzle
│  └─ migrate.ts          # aplica migrações de ./drizzle
├─ types.ts               # DTOs do domínio (espelham o frontend)
├─ repositories/          # ── executa os comandos com a ORM (Drizzle) ──
│  ├─ inscritoRepository.ts   (+ pagamentos)
│  ├─ quartoRepository.ts
│  ├─ produtoRepository.ts
│  ├─ vendaRepository.ts      (+ itens)
│  ├─ despesaRepository.ts
│  ├─ retiroRepository.ts     (atual + passados)
│  ├─ listaRepository.ts      (líderes, categorias)
│  ├─ escalaRepository.ts
│  └─ snapshotRepository.ts   (loadAll / replaceAll transacional)
├─ services/             # ── CRUD de negócio + validações ──
│  ├─ inscritoService.ts, quartoService.ts, produtoService.ts,
│  ├─ vendaService.ts, despesaService.ts, retiroService.ts
│  └─ snapshotService.ts
├─ routes/               # API REST (Express)
│  ├─ crudRouter.ts      # factory GET/POST/PUT/DELETE
│  ├─ snapshotRoutes.ts  # GET/PUT /snapshot (sync)
│  └─ index.ts
├─ app.ts / server.ts
```

## Configuração

1. Copie `.env.example` para `.env` e preencha `DATABASE_URL` (Neon).
   > ⚠️ A senha compartilhada em texto puro deve ser **rotacionada** no painel da Neon.
2. Instale as dependências: `npm install`

## Comandos

```bash
npm run dev          # API em modo watch (http://localhost:3001)
npm run db:generate  # gera migração SQL em ./drizzle a partir do schema
npm run db:migrate   # aplica migrações no banco
npm run db:push      # (alternativa) sincroniza schema direto no banco
npm run build        # compila para dist/
npm run start        # roda o build
```

## Endpoints

| Método | Rota                | Descrição                          |
| ------ | ------------------- | ---------------------------------- |
| GET    | `/api/health`       | healthcheck                        |
| GET/PUT| `/api/snapshot`     | estado completo (sync offline-first) |
| CRUD   | `/api/inscritos`    | list/get/create/update/delete      |
| CRUD   | `/api/quartos`      | idem                               |
| CRUD   | `/api/produtos`     | idem                               |
| CRUD   | `/api/vendas`       | idem                               |
| CRUD   | `/api/despesas`     | idem                               |
| GET/PUT| `/api/retiro`       | retiro atual                       |
| POST   | `/api/arquivos`     | upload de comprovante (corpo binário; `bytea`) |
| GET    | `/api/arquivos/:id` | download/visualização do arquivo   |
| DELETE | `/api/arquivos/:id` | remove o arquivo                   |

## Sincronização offline-first

O frontend mantém o `localStorage` como cache imediato. A cada alteração,
enfileira o snapshot; havendo internet, envia via `PUT /api/snapshot` (com
debounce). Sem internet, marca como pendente e reenvia ao reconectar. No load,
se não houver pendências locais, puxa o estado com `GET /api/snapshot`.
Conflitos são resolvidos por **last-write-wins** no nível do snapshot.

## Trocar de ORM

A escolha do Drizzle fica isolada na pasta `repositories/`. Para migrar (ex.:
Prisma), reimplemente os repositórios mantendo as mesmas assinaturas — services
e rotas não mudam.
