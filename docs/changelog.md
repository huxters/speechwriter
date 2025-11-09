# Micro-Factory / Speechwriter — Changelog

### v1.0 — 2025-11-08

**Overview**

- First full specification of the Micro-Factory System documented (`/docs/spec.md`)
- README replaced with founder-level summary and technical setup alignment
- Base repository scaffolding confirmed (pnpm workspace, admin console pattern)
- Documentation folder created (`/docs`)
- Changelog tracking initiated

**Current Phase**

- Phase A — _Foundational Scaffolding_  
  Status: In progress  
  Next: Verify dev environment runs cleanly and add minimal pipeline files

### v1.1 — 2025-11-08

**Overview**

- Added `/speechwriter` MVP page using full Planner → Drafter → Judge → Guardrail → Editor pipeline
- Added trace visibility for all pipeline stages
- Introduced validation for brief length and clearer error handling

**Current Phase**

- Phase B — Functional MVP
- Phase B.1 — Stabilisation complete

### v1.2 — 2025-11-09

- Updated spec.md to include Phase C₀ plan
- Unified dashboard/generate route
- Wired `/dashboard/generate` to the live Speechwriter pipeline (`/api/speechwriter`)
- Added live stage indicator for Planner → Drafter → Judge → Guardrail → Editor during generation
- Added optional debug trace toggle on the dashboard generate page
- Kept `/speechwriter` as an internal/debug route using the same pipeline

**Current Phase**

- Phase C₀ — Productise MVP: Complete
- Next: Phase C — use structured inputs and clearer constraints to improve pipeline intelligence

### v1.3 — 2025-11-08

**Overview**

- Extended Speechwriter pipeline to accept structured config:
  - audience, eventContext, tone, duration, keyPoints, redLines.
- Updated `plannerPrompt`:
  - Consumes both free-text brief and structured config.
  - Emits a strict JSON plan including constraints (mustInclude / mustAvoid).
- Updated `judgePrompt`:
  - Scores drafts against the planner JSON and constraints.
  - Returns explicit winner + reason (minified JSON).
- Updated `runSpeechwriterPipeline`:
  - Accepts `SpeechConfig`.
  - Passes config into Planner and Judge.
  - Preserves trace output and final speech.
- Updated `/api/speechwriter`:
  - Validates brief.
  - Accepts structured fields, sanitises, passes as `SpeechConfig`.
- Updated `/dashboard/generate`:
  - Structured inputs surfaced in UI and wired to API.
  - Live stage indicator and optional trace retained.

**Status**

- Phase C₀ (Productise MVP): ✅
- Phase C₁ (Structured Intelligence): ✅ first slice (plan/judge wired to structured inputs)
- Next: C₂ — persistence & history (see roadmap in docs/spec.md).

### v1.4 — 2025-11-08

**Overview**

- Added persistent run history for Speechwriter.
- Each successful pipeline run is now stored in `public.speeches` (scoped by `user_id`).
- RLS policies ensure users can only access their own speeches.
- `/api/speechwriter`:
  - On success, attempts to insert a row into `speeches`.
  - Appends a `persistence` entry into the trace indicating save/skip/failure.
- New UI:
  - `/dashboard/history` lists recent speeches with brief + snippet.
  - `/dashboard/history/[id]` shows full brief, structured fields, and final speech.
- Behaviour:
  - History only for authenticated users.
  - If persistence fails, the user still gets their speech (failure is logged only in trace).

**Status**

- Phase C₂ (Run History & Persistence): ✅

### v1.5 — 2025-11-08

**Overview**

- Implemented Guardrail v1 in the Speechwriter pipeline.
- Guardrail now runs after Judge and before Editor.
- Guardrail behaviour:
  - Reads the winning draft plus planner constraints:
    - `constraints.mustInclude`
    - `constraints.mustAvoid`
  - Applies minimal, conservative checks:
    - Avoids violating explicit must-avoid instructions.
    - Encourages inclusion of must-include themes where safe.
    - Softens clearly unprofessional or absurd language.
  - Returns structured JSON:
    - `status`: `"ok" | "edited" | "flagged"`
    - `safeText`: the version passed forward
    - `issues[]`: short notes on what was changed or flagged
- Orchestrator updates:
  - Uses `safeText` from Guardrail when available.
  - Always logs a `guardrail` stage entry in the trace:
    - “OK — no material issues”
    - “applied minimal edits…”
    - or “flagged concerns…”
  - Never blocks delivery of a final speech; worst case falls back to the judged draft.
- This makes Guardrail:
  - Inspectable,
  - Non-silent,
  - Non-destructive to UX,
  - Ready for future tightening.

## v1.5 – Admin Observer Console + Pipeline Stability

**Date:** 2025-11-08

- Implemented end-to-end pipeline with full Supabase persistence
- Added Admin / Observer console with draft comparison
- Guardrail v1 operational across test runs
- Simplified import structure to `apps/web/pipeline`
- Verified persistence and debugging through `/admin`
- CI temporarily disabled pending tests
