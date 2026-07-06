# Sistema de Retiros

Aplicação React + TypeScript (Vite) para gestão de retiros de igreja: cadastro
de retiro, formulário público de inscrição, check-in/pagamentos, montagem de
quartos, escalas de serviço, prestação de contas e cantina.

Este projeto é a **conversão do protótipo** `Sistema de Retiros.dc.html` (um
artefato do Claude, renderizado por um runtime próprio) para um app Vite real,
com a lógica reescrita em componentes/hooks/services tipados.

## Rodando

```bash
npm install
npm run dev        # servidor de desenvolvimento (http://localhost:5173)
npm run build      # type-check + build de produção em dist/
npm run preview    # serve o build de produção
```

## Arquitetura

```
src/
├─ main.tsx              # entrada; importa os CSS do design system
├─ App.tsx              # shell (sidebar + roteamento por "view") e providers
├─ config.ts            # nome da igreja / modo compacto (antigos "props")
├─ types.ts             # tipos de domínio (Inscrito, Quarto, Venda, ...)
├─ data/seed.ts         # estado inicial de exemplo (40 inscritos, etc.)
├─ lib/                 # utilidades puras
│  ├─ format.ts         # moeda, iniciais, datas
│  └─ idb.ts            # wrapper mínimo de IndexedDB (blobs)
├─ services/            # ── fronteira de persistência (trocável) ──
│  ├─ stateRepository.ts  # load/save do estado (hoje: localStorage)
│  └─ fileService.ts      # comprovantes/notas (hoje: IndexedDB)
├─ store/
│  ├─ RetiroContext.tsx # contexto + reducer + persistência automática
│  ├─ reducer.ts        # PATCH (merge raso) / RESET + estado inicial
│  ├─ selectors.ts      # derivações puras (pago, statusPag, ativos, ...)
│  └─ useActions.ts     # ações de negócio (gerarEscala, finalizarVenda, ...)
├─ hooks/useViewport.ts # breakpoints de layout
├─ components/          # Sidebar, Toast, MobileTopbar, FileDropField, modais/
└─ views/               # uma tela por módulo
```

### Onde os dados são guardados (offline-first)

- **Cache local (sempre)** → `localStorage` (chave `retiros-app-v3`), via
  `stateRepository`. É a fonte de verdade local e funciona offline.
- **Banco (quando há internet)** → Postgres/Neon, através do backend em
  [`server/`](server/). O `services/sync/syncManager` envia o snapshot do
  domínio (`PUT /api/snapshot`) com debounce; sem internet, marca como pendente
  e reenvia ao reconectar. No load, se não há pendências locais, puxa o estado
  do banco (`GET /api/snapshot`).
- **Arquivos de comprovante/nota** → armazenados no **backend (Postgres, coluna
  `bytea`)** via `fileService`. Mantêm o offline-first: ao salvar, o blob vai para
  o `IndexedDB` (cache/durabilidade) e sobe ao backend; offline, entra numa fila
  de uploads pendentes reenviada ao reconectar. Os `fileId` ficam ligados aos
  inscritos (`comprovanteId`) e despesas (`anexoId`), e podem ser abertos na UI.

O indicador no canto inferior esquerdo (`SyncBadge`) mostra o estado
(sincronizado / pendente / offline / erro) e permite forçar o envio.

### Backend

Veja [server/README.md](server/README.md). Em resumo:

```bash
cd server
npm install
# configure server/.env (DATABASE_URL da Neon)
npm run db:migrate   # cria as tabelas
npm run dev          # API em http://localhost:3001
```

A URL da API usada pelo frontend está em `.env` (`VITE_API_URL`).
