---
name: Unchained OS Project
description: Full private equity operating system built in Next.js 16 with 15 modules
type: project
---

Complete build of Unchained OS — a lightweight PE operating system.

**Stack:** Next.js 16.2.1, React 19, Tailwind v4, shadcn/ui, Zustand (localStorage), Recharts, Sonner, @tanstack/react-table, uuid

**Architecture:** All client-side with Zustand + `persist` middleware for localStorage. No backend.

**Routes built (all 12 compile clean):**
- `/` — Capital Dashboard (Module J)
- `/deal-analyzer` — Modules A+B+C+D+E (financial inputs, qualitative scores, projections, scenarios)
- `/deals` — Module F (ranked comparator with radar charts)
- `/pipeline` — Module G (kanban + list CRM, 8 stages)
- `/performance` — Module H+I (projected vs actual charts, alert triggers)
- `/capital` — Module K (capital allocation engine with pie/bar charts)
- `/investors` — Module L+M (multi-investor management + deal allocation)
- `/fund` — Module N (fund dashboard, investor perf table)
- `/reports` — Module O (monthly + deal PDF-style reports, print support)

**Key files:**
- `lib/types.ts` — all TypeScript interfaces
- `lib/calculations.ts` — all financial math (Module A–K logic)
- `lib/store.ts` — Zustand store with all CRUD + alert logic
- `components/layout/` — AppLayout, Sidebar, Header
- `components/modules/` — MetricCard, ScoreSlider

**Why:** `bg-gradient-to-*` must be `bg-linear-to-*` in Tailwind v4. Recharts v3 formatters need `(v: unknown)` not `(v: number)`. Select onValueChange returns `string | null`.
