# IntelPulse AI

An autonomous competitive intelligence workspace that turns strategic questions into verified signals and recommended actions.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/intel-pulse-ai run dev` — run the IntelPulse dashboard
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: workflow-managed `PORT` and `BASE_PATH` for the frontend; public evidence sources currently need no API key.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/intel-pulse-ai/src/App.tsx` — investigation form, loading trace, report dashboard, filters, evidence links, and tool-call UI
- `artifacts/api-server/src/routes/intelligence.ts` — tool router, public source adapters, scoring, fallback, and report assembly
- `lib/api-spec/openapi.yaml` — source of truth for the `/api/intelligence` contract
- `README.md` — architecture, API setup, local development, deployment, and limitations

## Architecture decisions

- The first build is stateless so the complete discovery-to-recommendation loop works without requiring account setup or a database.
- Research, news, and patent sources are server-side tools with bounded timeouts; partial tool failures do not abort the investigation.
- Demo mode and live-source fallback are explicit in both the report and the tool trace, never disguised as real-time evidence.
- OpenAPI is the contract shared by the Express server and generated React Query/Zod clients.

## Product

Users can frame an investigation, watch the staged agent workflow, inspect scored findings and confidence, explore trend signals, review recommendations, and expand every source tool call to see its reason and query.

## User preferences

No additional user preferences recorded.

## Gotchas

- After changing `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen`.
- Vite builds require `PORT` and `BASE_PATH`; use the managed workflow or provide them in a shell.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
