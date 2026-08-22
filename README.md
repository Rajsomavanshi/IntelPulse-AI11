# IntelPulse AI

Autonomous competitive intelligence for teams monitoring research, patents, competitors, and industry movement.

## Project Name: IntelPulse AI

## Team Member's : Raj Somvanshi, Aditya Kadu, Sanika Chakane, Siddhi Dhorkule, Pankaj Aher

## What it does

IntelPulse turns a strategic question into an evidence trail:

1. Understands the investigation scope
2. Selects relevant evidence tools
3. Searches public research, news, and patent sources
4. Scores and classifies findings as threats, opportunities, or neutral developments
5. Produces trends, confidence indicators, and owned recommendations

The dashboard exposes the tool calls, queries, result counts, source names, and fallback state so users can see why an answer was produced.

## Architecture

- **Frontend:** React + Vite + TypeScript
- **Backend:** Express 5 + TypeScript
- **API contract:** OpenAPI 3.1 with generated React Query and Zod clients
- **Research tool:** Crossref public works API for recent scientific publications
- **News tool:** GDELT public document API for industry and competitor news
- **Patent tool:** PatentsView public API for patent filings and assignee activity
- **Persistence:** Stateless MVP; a future monitoring scheduler can add PostgreSQL without changing the investigation contract

The agent's tool router uses the strategic question to avoid irrelevant calls. Broad monitoring investigations use research/news/patent evidence together; patent-specific questions prioritize patents; news-specific questions prioritize current news and research context.

## Run locally

```bash
pnpm install
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/intel-pulse-ai run dev
```

The Replit workflows provide the required `PORT` and `BASE_PATH` values. For a normal shell run, set them before starting Vite.

```bash
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/intel-pulse-ai run dev
```

Generate clients after changing `lib/api-spec/openapi.yaml`:

```bash
pnpm --filter @workspace/api-spec run codegen
```

Validate the workspace:

```bash
pnpm run typecheck
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/intel-pulse-ai run typecheck
```

## API setup

The MVP uses public endpoints and does not require an API key. All external calls happen server-side and have bounded timeouts. If a source is unavailable or returns no usable evidence, the report switches to **DEMO DATA** and labels the fallback in the report and tool trace. Demo mode can also be selected from the UI without making external calls.

No secret is required for the current MVP. If authenticated providers are added later, keep credentials in Replit Secrets or environment variables and never expose them to the frontend.

## Example investigation

Company: `NVIDIA`  
Competitors: `AMD, Intel`  
Technology: `AI semiconductor chips`  
Period: `Last 7 days`

The resulting brief includes executive summary, critical alerts, research intelligence, patent intelligence, competitor activity, trend radar, opportunities, threats, recommendations, and linked source evidence.

## Limitations

- Public source coverage and rate limits can vary.
- Cross-source entity resolution is intentionally lightweight in this MVP.
- Demo data is simulated for demonstrating the workflow and must not be treated as real-time evidence.
- Persistent saved investigations and scheduled monitoring are not included yet.

## Deployment

The React artifact builds as static assets and the API server runs as an Express service. The generated artifact workflows already provide the correct preview routing. For external deployment, serve the Vite build from a static host such as Vercel and run the API service on Render or Railway; configure the frontend to use the deployed `/api` origin if the services are split.
