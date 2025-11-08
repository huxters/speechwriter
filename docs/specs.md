# Speechwriter / Micro-Factory MVP — Product Specification

_v1.1 – 2025-11-08_

---

## 1. Purpose

Speechwriter is the **first live instantiation** of the wider **Micro-Factory System** — a modular environment for producing founder-grade AI products with disciplined architecture, human-centred UX, and transparent reasoning flows.

The goal of this first release is **to prove the full end-to-end pipeline pattern** that all later Micro-Factory products will inherit:

> “Planner → Drafter → Judge → Guardrail → Editor → Output”

Speechwriter simply makes that architecture visible.  
It turns a free-text brief into a structured, spoken-ready final output while showing every reasoning step.

Longer-term, this architecture underpins a multi-product ecosystem (Speechwriter, Decision Optimisation Engine, Perspective Engine, etc.) — all sharing a **common pipeline, identity, and admin console**.

---

## 2. Current Scope (Phase B.1)

| Element                 | Status      | Description                                                                    |
| ----------------------- | ----------- | ------------------------------------------------------------------------------ |
| **Functional Pipeline** | ✅ Complete | Planner → Drafter → Judge → Guardrail (stub) → Editor all operational.         |
| **Trace Visibility**    | ✅ Complete | Full stage-by-stage trace rendered in the UI for transparency and debugging.   |
| **Validation**          | ✅ Complete | Input limited to 2000 characters, with explicit front-end and back-end checks. |
| **Error Handling**      | ✅ Complete | Structured errors surfaced to UI; pipeline failures handled gracefully.        |
| **UI Layer**            | ✅ MVP      | `/speechwriter` route provides direct interaction and visible trace.           |
| **Database / Auth**     | ⚙️ Baseline | Supabase authentication active (email OTP magic link). No persistence yet.     |
| **Docs & Versioning**   | ✅ Live     | `docs/spec.md` and `docs/changelog.md` under version control.                  |

---

## 3. System Architecture

```
root/
├── apps/
│   └── web/
│       └── app/
│           ├── dashboard/            # product UI
│           ├── speechwriter/         # internal MVP test page
│           ├── api/
│           │   └── speechwriter/     # Next.js route calling pipeline
│           └── layout.tsx / globals.css
├── pipeline/
│   ├── runSpeechwriter.ts            # orchestrator (Planner → … → Editor)
│   ├── planner.prompt.ts
│   ├── drafter.prompt.ts
│   ├── judge.prompt.ts
│   ├── guardrail.prompt.ts
│   └── editor.prompt.ts
├── docs/
│   ├── spec.md
│   └── changelog.md
└── ...
```

**Stack**

- Framework: Next.js 14 (App Router)
- Language: TypeScript
- Database: Supabase (PostgreSQL + RLS)
- Styling: Tailwind CSS
- Auth: Supabase Magic Link (Email OTP)
- AI Orchestration: OpenAI API (via official client)

---

## 4. Pipeline Overview

Each stage is encapsulated as a **system prompt + single API call**.  
`runSpeechwriterPipeline()` executes them sequentially and collects structured logs.

| Stage         | Function                                           | Model        | Output             |
| ------------- | -------------------------------------------------- | ------------ | ------------------ |
| **Planner**   | Converts free-text brief into structured plan JSON | gpt-4.1-mini | `planner.json`     |
| **Drafter**   | Produces 2 alternative drafts from planner output  | gpt-4.1-mini | `draft1`, `draft2` |
| **Judge**     | Compares drafts → selects winner + reason          | gpt-4.1-mini | `{winner, reason}` |
| **Guardrail** | Performs factual/tone safety check (stub)          | gpt-4.1-mini | `"OK"`             |
| **Editor**    | Refines winning draft for spoken delivery          | gpt-4.1-mini | `finalSpeech`      |

All intermediate data are preserved in a `trace[]` array:

```ts
[{ stage: "planner", message: "Planner: completed and JSON parsed." }, ...]
```

Returned payload:

```ts
{
  finalSpeech,
  planner,
  judge: { winner, reason },
  trace
}
```

---

## 5. Design Principles

1. **Transparency** — show the reasoning chain (“human soul + machine mind”).
2. **Determinism** — single pipeline, consistent per-run flow.
3. **Isolation** — each stage callable independently for testing.
4. **Simplicity first** — no RAG, agents, or external orchestration until justified.
5. **Product-ready discipline** — documented folders, clean dependencies, PNPM workflow, versioned docs.

---

## 6. Roadmap (Phases A – E)

| Phase   | Name                        | Status      | Objectives                                                                                                                |
| ------- | --------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| **A**   | _Functional Scaffolding_    | ✅ Complete | Base Next.js app, Supabase auth, folder structure, local pipeline shell.                                                  |
| **B**   | _End-to-End Pipeline MVP_   | ✅ Complete | Planner → Editor pipeline working; trace visible.                                                                         |
| **B.1** | _Stabilisation & Testing_   | ✅ Complete | Input validation, UI feedback, error handling, consistent trace.                                                          |
| **C₀**  | _Productise MVP_            | 🚧 Next     | Replace `/dashboard/generate` logic with live pipeline; keep `/speechwriter` as internal debug.                           |
| **C**   | _Intelligent Enhancements_  | ⏳ Planned  | Use structured form inputs (tone, audience, etc.) as Planner context; introduce Judge criteria and Editor style controls. |
| **D**   | _Admin & Observer Console_  | 🔜          | History of runs, view raw stage outputs, toggle prompt versions live.                                                     |
| **E**   | _Micro-Factory Integration_ | 🔜          | Shared Admin Console, profile identity, versioned prompt library, cross-product pipeline template.                        |

---

## 7. Operating Conventions

### Development

- **Start environment** → _Tasks → Start Web_
- **Stop environment** → _Tasks → Stop Server_
- No daily reinstalls; use PNPM workflow (`pnpm --filter web dev` if needed).

### Commits

- Use short atomic messages (`feat:`, `fix:`, `docs:` etc.).
- Always update `docs/changelog.md` on functional changes.
- Tag significant milestones (v1.0, v1.1, etc.).

### Directory Rules

- No `src/` folder — everything under `apps/web/app`.
- Shared business logic lives in `/pipeline`.
- Each new pipeline inherits `runSpeechwriterPipeline()` as template.

---

## 8. Next Immediate Tasks

1. **Docs sync** — changelog & spec committed (v1.1).
2. **Phase C₀** — unify `/dashboard/generate` with `/api/speechwriter`.
3. **Phase C** — structured form → planner context.
4. **Prepare Admin Console Pattern** (already standardised in Micro-Factory spec).

---

## 9. Long-Term Vision

Speechwriter demonstrates the **Micro-Factory thesis**:  
that _a single, inspectable decision pipeline can be reused across any domain_ — speechwriting, career choice, planning, or strategy — where clarity and tone matter.

> **“The human soul makes the choice; the machine mind makes the thinking sharper.”**

This principle anchors every product built on this foundation.

---
