# Copilot Instructions for Dukem Music Frontend

## Project Overview
This is a Next.js 15 (App Router) application using the T3 Stack philosophy. It uses TypeScript, Prisma (PostgreSQL), Better Auth, Inngest, and Tailwind CSS.

## Architecture & Core Patterns

### Authentication
- **Library:** `better-auth`
- **Configuration:** Server config in `src/lib/auth.ts`, client config in `src/lib/auth-client.ts`.
- **Adapter:** Uses Prisma adapter.
- **API Route:** Handled in `src/app/api/auth/[...all]/route.ts`.
- **Usage:** Use `authClient` for client-side auth interactions.

### Database
- **ORM:** Prisma
- **Client:** Singleton instance exported as `db` from `src/server/db.ts`.
- **Schema:** `prisma/schema.prisma`.
- **Access:** Always import `db` from `~/server/db` to avoid connection exhaustion in dev.

### Background Jobs
- **Library:** Inngest
- **Client:** `src/inngest/client.ts`
- **Functions:** Defined in `src/inngest/functions.ts`.
- **Registration:** Functions must be added to the `serve` handler in `src/app/api/inngest/route.ts`.
- **Pattern:** Use `step.run` for reliable execution steps.

### UI & Styling
- **Framework:** Tailwind CSS v4.
- **Components:** Shadcn UI located in `src/components/ui`.
- **Icons:** Lucide React.
- **Toasts:** Sonner.

## Developer Workflows

### Database Management
- **Generate Client:** `pnpm db:generate` (runs `prisma generate`)
- **Migration:** `pnpm db:migrate` (runs `prisma migrate deploy`)
- **Push Schema:** `pnpm db:push` (prototyping)
- **Studio:** `pnpm db:studio`

### Local Development
- **Start App:** `pnpm dev`
- **Start Inngest:** `pnpm inngest:dev` (Required for testing background functions)

## Coding Conventions

- **Imports:** Use the `~/` alias for all internal imports (e.g., `~/server/db`, `~/components/ui/button`).
- **Environment:** Use `~/env` for type-safe environment variables. Do not use `process.env` directly.
- **Type Safety:** Zod is used for schema validation.
- **Server Actions:** Prefer Server Actions for mutations where appropriate, or API routes for complex logic.

## Key File Locations
- `src/env.js` - Environment variable schema
- `src/server/db.ts` - Database client
- `src/lib/auth.ts` - Auth configuration
- `src/inngest/` - Background job logic
