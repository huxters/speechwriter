# Speechwriter / Micro-Factory MVP — Product Specification

_v1.2 – 2025-11-08_

---

## 1. Purpose

Speechwriter is the first live instantiation of the wider **Micro-Factory System** — a modular environment for producing founder-grade AI products with disciplined architecture, human-centred UX, and transparent reasoning flows.

The primary objective of this MVP is to **prove the end-to-end pipeline pattern** that later Micro-Factory products will inherit:

> Planner → Drafter → Judge → Guardrail → Editor → Output

Speechwriter makes that architecture visible: it turns a brief into a structured, spoken-ready final draft while exposing the reasoning chain.

Longer-term, this architecture underpins a multi-product ecosystem (Speechwriter, Decision Engine, Perspective Engine, etc.), all sharing a common pipeline, identity model, and admin console.

---

## 2. Current Scope (Phase C₀ Complete)

| Element                   | Status | Description                                                                                                                                       |
| ------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Canonical Pipeline**    | ✅     | Single orchestrated flow: Planner → Drafter → Judge → Guardrail (stub) → Editor.                                                                  |
| **Dashboard Integration** | ✅     | `/dashboard/generate` uses the live pipeline via `/api/speechwriter`. This is the primary UX surface.                                             |
| **Internal Debug Page**   | ✅     | `/speechwriter` retained as a developer-facing page for direct testing and trace inspection.                                                      |
| **Trace Visibility**      | ✅     | Pipeline returns a structured `trace[]`; dashboard offers a "Show debug trace" toggle.                                                            |
| **Live Stage Indicator**  | ✅     | While running, the dashboard shows a stage label stepping through Planner → Drafter → Judge → Guardrail → Editor (UX hint aligned with pipeline). |
| **Validation & Limits**   | ✅     | Input constrained to 2000 characters with front-end and back-end checks; over-limit submissions blocked clearly.                                  |
| **Error Handling**        | ✅     | Known failure modes mapped to user-readable messages; unexpected errors return a generic safe failure.                                            |
| **Auth & Infra**          | ⚙️     | Supabase auth present; no speech run persistence yet.                                                                                             |
| **Docs & Versioning**     | ✅     | `docs/spec.md` (snapshot) + `docs/changelog.md` (history) maintained and versioned.                                                               |

---

## 3. System Architecture

```
root/
├── apps/
│   └── web/
│       └── app/
│           ├── dashboard/
│           │   └── generate/        # Primary New Speech UI (uses pipeline)
│           ├── speechwriter/        # Internal debug UI (same pipeline)
│           ├── api/
│           │   └── speechwriter/
│           │       └── route.ts     # Next.js API route → runSpeechwriterPipeline
│           └── layout.tsx / globals.css
├── pipeline/
│   ├── runSpeechwriter.ts           # Orchestrator (Planner → … → Editor)
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
- AI Orchestration: OpenAI API (official client)

---

## 4. Pipeline Overview

Each stage is implemented as a dedicated prompt + model call.  
`runSpeechwriterPipeline()` coordinates all stages and returns both the final speech and a machine-readable trace.

### 4.1 Stages

| Stage         | Responsibility                                                                                  | Output                      |
| ------------- | ----------------------------------------------------------------------------------------------- | --------------------------- |
| **Planner**   | Convert the raw brief into a structured JSON plan: core message, audience summary, pillars.     | `planner: object`           |
| **Drafter**   | Generate two alternative drafts based on the plan.                                              | `draft1`, `draft2`          |
| **Judge**     | Compare drafts against the plan; select winner with a short justification.                      | `judge: { winner, reason }` |
| **Guardrail** | Placeholder for safety/factual checks. MVP always returns `"OK"`.                               | `"OK"`                      |
| **Editor**    | Refine the winning draft for spoken delivery: clarity, rhythm, strong open/close; no new facts. | `finalSpeech: string`       |

### 4.2 Trace

The orchestrator builds a `trace: { stage, message }[]` log, e.g.:

```ts
[
  {
    stage: 'planner',
    message: 'Planner: generating structured plan from brief starting with: "..."',
  },
  { stage: 'planner', message: 'Planner: completed and JSON parsed.' },
  { stage: 'drafter', message: 'Drafter: produced 2 drafts.' },
  { stage: 'judge', message: 'Judge: selected draft 2 — clearer focus on core message.' },
  { stage: 'guardrail', message: 'Guardrail: OK.' },
  { stage: 'editor', message: 'Editor: final speech ready.' },
];
```

The API returns:

```ts
{
  finalSpeech,
  planner,
  judge: { winner, reason },
  trace
}
```

---

## 5. UX Behaviour

### 5.1 `/dashboard/generate` (Primary User Flow)

- Dark themed “New Speech” page.
- User pastes or writes a brief (up to 2000 characters).
- On submit:
  - Button shows `Running pipeline...`.
  - A live label shows the current stage name in sequence (Planner → Drafter → Judge → Guardrail → Editor) while the request is in flight.
  - On success: final speech appears.
  - A small “Show debug trace” toggle reveals the internal stage-by-stage trace (for QA and power users).

### 5.2 `/speechwriter` (Internal Debug Surface)

- Mirrors the same pipeline but is positioned as an internal/testing route.
- Always shows the trace; used for development and inspection.
- Not the primary end-user entry point.

---

## 6. Design Principles

1. **Single Source of Truth**
   - One orchestrator (`runSpeechwriterPipeline`) and one API (`/api/speechwriter`) used by all UIs.

2. **Transparency without Noise**
   - End users see a clean experience; trace is available but optional.
   - Developers have `/speechwriter` for full visibility.

3. **Fail Safely**
   - Invalid model outputs trigger controlled fallbacks or clear errors.
   - Over-long or malformed inputs are rejected explicitly.

4. **Extensibility**
   - Pipeline stages are modular.
   - Future products can reuse the same pattern with different prompts or evaluators.

5. **No Premature Complexity**
   - No RAG, no streaming infra, no external agents at this stage.
   - Those are earned later if justified by real constraints.

---

## 7. Roadmap

### Completed

- **Phase A – Functional Scaffolding**  
  Base app, auth, structure, docs.

- **Phase B – End-to-End Pipeline MVP**  
  Planner → Editor with visible trace.

- **Phase B.1 – Stabilisation & Testing**  
  Input limits, error handling, consistent trace.

- **Phase C₀ – Productise MVP**  
  `/dashboard/generate` wired to live pipeline; `/speechwriter` as debug.

### Next

- **Phase C – Intelligent Enhancements**

  Focus: make outputs systematically better using structured inputs and clearer criteria, without changing the pipeline skeleton.

  Initial scope:
  - Extend the “New Speech” form with structured fields:
    - audience, event context, duration, tone, must-include points, red lines.
  - Feed these into `plannerPrompt` as explicit, typed context.
  - Update `judgePrompt`:
    - score drafts on faithfulness to plan, clarity, spoken cadence, constraint adherence.
  - Update `editorPrompt`:
    - respect style and constraints from the plan.
  - Keep the same return shape (`finalSpeech`, `planner`, `judge`, `trace`).

- **Phase D – Admin & Observer Console**
  - Runs history, metadata, environment flags.
  - View per-stage raw outputs for a given run.
  - Versioned prompt sets (A/B testing, rollback).

- **Phase E – Micro-Factory Integration**
  - Extract this repo into a template for new products.
  - Shared admin console, shared pipeline library.
  - Consistent identity & permissions model across products.

---

## 8. Operating Conventions

- Use **Start Web** / **Stop Server** tasks to run locally.
- Keep all orchestration logic in `/pipeline`, not inside pages.
- Any new product or feature should:
  - Plug into the existing pipeline pattern, or
  - Introduce a new pipeline file alongside `runSpeechwriter.ts` with the same architectural style.

---

## 9. Strategic Note

Speechwriter’s role is to **prove the Micro-Factory pattern in public**:

- A visible, defensible reasoning chain.
- A disciplined, template-able codebase.
- A working example where the machine handles structure and synthesis, and the human retains judgment and ownership.

This is the spine future products will stand on.

---
