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
- `BETTER_AUTH_SECRET` (min. 32 chars; e.g. `openssl rand -base64 32`)
- `BETTER_AUTH_URL` (default `http://localhost:3000`)
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` (for one-time admin seed only)

Optional for the frontend (root `.env`, loaded via Vite `envDir`):

- `VITE_API_BASE_URL` (default `/api` — proxied to `PORT` in dev via Vite)

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
npm run db:seed-admin
```

## Admin access

- Admin UI: http://localhost:5173/admin (redirects to login without a session)
- Public sign-up is disabled; create the first user with `npm run db:seed-admin` using `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`
