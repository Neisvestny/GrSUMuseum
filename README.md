# Museum

Full-stack TypeScript monorepo:

- **@museum/web** — React + Vite (`apps/web`)
- **@museum/server** — Express + PostgreSQL + Prisma (`apps/server`)
- **@museum/document** — shared CMS document types (`packages/document`)

## Requirements

- Node.js `20` (see `.nvmrc`)
- PostgreSQL (credentials via environment variables)

## Environment

Create `.env` in the **repository root** (copy from `.env.example`):

- `PORT` (default `3000`)
- `CORS_ORIGIN` (default `http://localhost:5173`, comma-separated)
- `DATABASE_URL` or `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`

Optional for the frontend (`apps/web/.env`):

- `VITE_API_BASE_URL` (default `http://localhost:3001/api`)

Uploaded media is stored under `apps/web/public/` (`images`, `videos`, `files`).

## Development

```bash
npm install
npm run dev
```

Runs Vite and the API in parallel via [Turborepo](https://turbo.build). Use the repo root only (paths resolve from the monorepo layout, not `process.cwd()`).

- Frontend: http://localhost:5173
- API: http://localhost:`PORT` (from `.env`)

## Quality checks

```bash
npm run lint
npm run type-check
npm run check
```

## Production build

```bash
npm run build
npm run start
```

Builds the web app first, then compiles the server. Static SPA is served from `apps/web/dist`; user uploads remain in `apps/web/public/`.

## Database

```bash
npm run db:migrate
npm run db:generate
npm run db:deploy
```
