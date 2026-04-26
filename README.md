# Museum

Full-stack TypeScript project:

- frontend: `React + Vite`
- backend: `Express + PostgreSQL`

## Requirements

- Node.js `>= 20`
- PostgreSQL (credentials are configured through environment variables)

## Environment

Backend reads these variables:

- `PORT` (default `3000`)
- `CORS_ORIGIN` (default `http://localhost:5173`, supports comma-separated origins)
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

## Development

Install dependencies:

```bash
npm install
```

Run frontend:

```bash
npm run dev
```

Run backend (watch mode):

```bash
npm run dev:server
```

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
