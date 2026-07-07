# Deploy (gratuito)

- **Frontend (Vite/React)** → **Vercel**
- **Backend (Express)** → **Render** (Web Service, plano Free)
- **Banco (Postgres)** → **Neon** (já configurado, migrado e com o admin criado)

O frontend e o backend ficam em URLs diferentes; o frontend fala com o backend
pela variável `VITE_API_URL`.

## Antes de começar (segurança)

- **Rotacione a senha do banco na Neon** (a antiga foi exposta) e use a nova em `DATABASE_URL`.
- Defina um **`JWT_SECRET` forte e aleatório** (ex.: 32+ caracteres) — não use o placeholder.
- Os arquivos `.env` **não** estão no git; as variáveis são configuradas nos painéis.

---

## Passo 1 — Backend no Render

1. https://render.com → **New** → **Web Service** → conecte o repositório `Vitor2008/sistema-retiro`.
2. Configurações:
   - **Root Directory:** `server`
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
   - **Instance Type:** Free
3. **Environment Variables:**
   | Variável | Valor |
   | --- | --- |
   | `DATABASE_URL` | string de conexão da Neon |
   | `JWT_SECRET` | segredo longo e aleatório |
   | `ADMIN_USERNAME` | `adm` |
   | `ADMIN_PASSWORD` | (sua senha do admin) |
   | `CORS_ORIGIN` | (preencher no Passo 3, com a URL da Vercel) |
   > `PORT` é fornecida automaticamente pelo Render — não precisa definir.
4. Crie o serviço. Ao terminar, anote a URL pública (ex.: `https://sistema-retiro-api.onrender.com`).

> **Migrações/seed:** o banco Neon já está migrado e com o admin. Se algum dia
> precisar recriar, rode localmente `npm run db:migrate` e `npm run db:seed-admin`.

## Passo 2 — Frontend na Vercel

1. https://vercel.com → **Add New → Project** → importe `Vitor2008/sistema-retiro`.
2. Framework: **Vite** (detectado). **Root Directory:** `./` (raiz). Build/Output padrão (`npm run build` → `dist`).
3. **Environment Variable:**
   | Variável | Valor |
   | --- | --- |
   | `VITE_API_URL` | `https://SUA-URL-DO-RENDER/api` |
4. Deploy. Anote a URL (ex.: `https://sistema-retiro.vercel.app`).

## Passo 3 — Liberar o CORS

1. No Render, edite `CORS_ORIGIN` = a URL da Vercel (ex.: `https://sistema-retiro.vercel.app`).
2. Salve (o Render redeploya). Pronto.

---

## Observações

- **Render Free hiberna** após ~15 min sem uso; a primeira chamada depois disso
  demora ~30–60s para "acordar". Como o app é **offline-first**, ele continua
  funcionando no cache local e sincroniza quando o backend responde.
- Toda alteração enviada ao GitHub redeploya automaticamente Vercel e Render.
- Primeiro acesso: entre como `adm`, configure o retiro (**Editar retiro**),
  cadastre os **Líderes** (card na tela de Retiros) e produtos/quartos conforme necessário.
