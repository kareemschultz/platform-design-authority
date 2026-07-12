# Meridian Scaffold Provenance and Operations

The executable scaffold now occupies the repository root under ADR-0025. It is controlled prototype evidence originating in PR #2, generated with Better-T-Stack 3.36.3, and reviewed against root `AGENTS.md`, `CLAUDE.md`, PDA-FND-002, ADR-0006, ADR-0020, ADR-0021, ADR-0022, ADR-0024, PDA-PLT-028, PDA-UX-028, PDA-ARC-019, and PDA-ENGR-013.

This is not production approval for the runtime, scaffold, UI system, database image, auth configuration, documentation portal, or native auth exchange.

## Provenance

- Initial generated SHA: `75e793fdcb2c79066bcb2bfc744971d608e56a00`
- Generation date: 2026-07-12
- Original generated selection, reconstructed from `bts.jsonc` and retained only as provenance (it includes rejected addons/examples and is **not** the governed reproduction command):

```bash
bun create better-t-stack@3.36.3 meridian --frontend next native-bare --backend hono --runtime bun --database postgres --orm drizzle --api orpc --auth better-auth --payments none --addons biome fumadocs pwa skills turborepo ultracite --examples ai todo --db-setup docker --web-deploy docker --server-deploy docker --git --package-manager bun --install
```

- Governed reproducible command verified on 2026-07-12. It excludes Biome as a separately selected addon, generated skills, Fumadocs, AI and Todo; Fumadocs remains a separately reviewed ADR-0021 controlled prototype:

```bash
bun create better-t-stack@3.36.3 meridian --frontend next native-bare --backend hono --runtime bun --api orpc --auth better-auth --payments none --database postgres --orm drizzle --db-setup docker --package-manager bun --git --web-deploy docker --server-deploy docker --install --addons pwa turborepo ultracite --examples none --disable-analytics --directory-conflict error --dry-run --verbose
```

Reviewed deviations from generated output:

- Removed generated AI and Todo examples from the governed first-slice prototype.
- Removed the Better-T-Stack `skills` addon payload, including its AI SDK skill and nested third-party instruction trees, so root and nested repository governance remain the only agent authority.
- Pinned Bun 1.3.14, Hono 4.12.29, shadcn 4.13.0, and Lucide 1.24.0. The upstream oRPC project has a general `v1.14.8` tag, while the five scoped packages used here publish a coherent stable `1.14.7` set; this prototype correctly pins `1.14.7` and records the distinction in `docs/implementation/IMPLEMENTATION_CONFLICTS.md`.
- Reconciled shadcn metadata to the Base UI/Rhea, Neutral/Blue, Geist/Inter, Lucide, default-radius bootstrap selected in PDA-UX-028.
- Hardened Better Auth cookie and trusted-origin configuration for prototype review.

Known limitations:

- Native auth exchange is deferred pending Expo secure-storage, deep-link, app-link, recovery, lost-device, and revocation evidence.
- Node fallback uses the separate `server` package `start:node` entry backed by the Hono Node adapter.
- Accessibility, white-label, tenant-isolation, PostgreSQL restore, and production runtime evidence are not claimed.
- PWA support is continuity only and does not replace governed offline sync.

## Features

- **TypeScript** - For type safety and improved developer experience
- **Next.js** - Full-stack React framework
- **React Native** - Build mobile apps using React
- **Expo** - Tools for React Native development
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **Shared UI package** - shadcn/ui primitives live in `packages/ui`
- **Hono** - Lightweight, performant server framework
- **oRPC** - End-to-end type-safe APIs with OpenAPI integration
- **Bun** - Primary prototype runtime with Node fallback checks
- **Drizzle** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Authentication** - Better-Auth
- **Ultracite** - The single governed lint/format authority, using its pinned Biome engine
- **PWA** - Progressive Web App continuity seam
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
bun install --frozen-lockfile
```

## Containerized Prototype Setup

This prototype uses loopback-only web and server ports plus a private PostgreSQL 18.4 Compose service. Drizzle owns the Better Auth migration; it does not own extension objects.

1. Set required local environment variables:

```bash
export POSTGRES_PASSWORD="$(openssl rand -hex 24)"
export BETTER_AUTH_SECRET="$(openssl rand -hex 32)"
```

2. Build and start the complete local stack:

```bash
bun run docker:up
```

3. Apply the committed authentication migration from inside the server container:

```bash
docker compose exec server bun run --cwd /app/packages/db db:migrate
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
The API is running at [http://localhost:3000](http://localhost:3000).

The bundled PostgreSQL service is deliberately not published to the host. Direct `bun run dev` server development requires a separately configured host-reachable PostgreSQL 18 database. Do not use `db:push` against the baseline database because Drizzle schema introspection may attempt to alter extension-owned `pg_stat_statements` views.

## UI Customization

React web apps in this stack share shadcn/ui primitives through `packages/ui`.

- Change design tokens and global styles in `packages/ui/src/styles/globals.css`
- Update shared primitives in `packages/ui/src/components/*`
- Adjust shadcn aliases or style config in `packages/ui/components.json` and `apps/web/components.json`

### Add more shared components

Run this from the project root to add more primitives to the shared UI package:

```bash
bunx shadcn@4.13.0 add accordion dialog popover sheet table -c packages/ui
```

Import shared components like this:

```tsx
import { Button } from "@meridian/ui/components/button";
```

### Add app-specific blocks

If you want to add app-specific blocks instead of shared primitives, run the pinned shadcn CLI from `apps/web` and review the diff before keeping generated source.

## Deployment

### Docker Compose

- Target: local controlled prototype web + server + PostgreSQL
- Config: `docker-compose.yml` (app Dockerfiles live in `apps/*/Dockerfile`)
- Build images: bun run docker:build
- Start: bun run docker:up
- Logs: bun run docker:logs
- Stop: bun run docker:down

`POSTGRES_PASSWORD` and `BETTER_AUTH_SECRET` are required. PostgreSQL is not published to the host. Backup, restore, and migration notes are in `ops/postgres/README.md`.

For more details, see the guide on [Deploying with Docker Compose](https://www.better-t-stack.dev/docs/guides/docker).

## Git Hooks and Formatting

- Run checks: `bun run check`
- Run tests: `bun run test`

## Project Structure

```text
apps/
├── docs/        # Fumadocs documentation application
├── native/      # React Native and Expo application
├── server/      # Hono and oRPC server
└── web/         # Next.js web application
packages/
├── api/         # Shared API procedures and context
├── auth/        # Better Auth configuration
├── config/      # Shared TypeScript configuration
├── db/          # Drizzle schemas and migrations
├── env/         # Environment validation
└── ui/          # Shared source-owned UI components
```

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run dev:web`: Start only the web application
- `bun run dev:server`: Start only the server
- `bun run check-types`: Check TypeScript types across all apps
- `bun run test`: Run local Bun tests
- `bun run dev:native`: Start the React Native/Expo development server
- `bun run db:push`: Experimental disposable-database synchronization; prohibited against the bundled extension-bearing baseline
- `bun run db:generate`: Generate database client/types
- `bun run db:migrate`: Run database migrations
- `bun run db:studio`: Open database studio UI
- `bun run check`: Run the pinned Ultracite formatting and linting authority
- `cd apps/web && bun run generate-pwa-assets`: Generate PWA assets
- `bun run docker:build`: Build the Docker Compose images
- `bun run docker:up`: Build and start the Docker Compose stack
- `bun run docker:logs`: Tail logs from the Docker Compose stack
- `bun run docker:down`: Stop the Docker Compose stack
