# Vivah Australia

AI-ready monorepo foundation for the Vivah Australia matrimonial platform.

## Prerequisites

- Node.js 22+
- pnpm 10+

## Setup

```bash
pnpm install
```

Copy environment examples before running locally:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

## Development

```bash
pnpm dev
```

- Web: `http://localhost:3000`
- API: `http://localhost:4000`
- API health check: `http://localhost:4000/health`

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Workspace Layout

```text
/apps
  /web      Next.js frontend
  /api      Express API backend
/packages
  /shared   Shared TypeScript constants, enums, validators, and env schemas
  /config   Shared TypeScript config
  /ui       Placeholder package for future shared UI components
/docs
  /api
  /architecture
  /deployment
/scripts
```
