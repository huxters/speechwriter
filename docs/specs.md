# Speechwriter / Micro-Factory MVP — Full Product Specification

_v1.3 — 2025-11-08_  
_(Author: S. Highlander)_

---

## 1. Vision and Context

Speechwriter is the **first deployed product** of the **Micro-Factory System** — a modular architecture for producing tightly-scoped, high-integrity AI applications with transparent reasoning, founder-grade polish, and complete local control.

Its purpose is to **demonstrate the Micro-Factory pipeline model in production**:  
a single composable orchestration pattern  
`Planner → Drafter → Judge → Guardrail → Editor`,  
wrapped in a clean UX and backed by auditable trace data.

This product is not about speechwriting per se; it is about **building the infrastructure and discipline** that will allow future tools (Decision Engine, Perspective Engine, etc.) to share the same backbone.

---

## 2. Product Objectives

1. **Demonstrate the pipeline contract** end-to-end inside a live Next.js app.
2. **Provide a usable prototype** for professionals who want to convert structured ideas into spoken-ready drafts.
3. **Prove design integrity:** consistent prompts, explicit JSON hand-offs, robust orchestration, inspectable reasoning.
4. **Lay the groundwork for persistence, analytics, and guardrails.**

---

## 3. Functional Summary (v1.3)

| Layer                     | Status    | Description                                                                                                      |
| ------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------- |
| **Pipeline Orchestrator** | ✅        | `runSpeechwriterPipeline`: executes Planner → Drafter → Judge → Guardrail (stub) → Editor with structured trace. |
| **Structured Input Form** | ✅        | `/dashboard/generate` captures brief, audience, context, tone, duration, must-include, must-avoid.               |
| **Planner Prompt**        | ✅        | Combines brief + config → emits strict JSON plan.                                                                |
| **Drafter Prompt**        | ✅        | Produces two candidate drafts for evaluation.                                                                    |
| **Judge Prompt**          | ✅        | Scores drafts vs plan & constraints → returns winner + reason.                                                   |
| **Guardrail Prompt**      | ✅ (stub) | Placeholder for future safety / consistency enforcement.                                                         |
| **Editor Prompt**         | ✅        | Refines winning draft for cadence and clarity.                                                                   |
| **API Route**             | ✅        | `/api/speechwriter` validates inputs, calls orchestrator, returns `{finalSpeech, trace, planner, judge}`.        |
| **UI Integration**        | ✅        | `/dashboard/generate` → structured form + live stage indicator + optional trace.                                 |
| **Auth Layer**            | ✅        | Supabase magic-link; `/dashboard/*` server-side protected.                                                       |
| **Persistence**           | ⏳        | Next milestone (Phase C₂).                                                                                       |
| **Admin Console**         | ⏳        | Planned (Phase D).                                                                                               |
| **Guardrail v1**          | ⏳        | Planned (Phase E).                                                                                               |
| **CI Workflow**           | 🚫        | Temporarily disabled (`.github/workflows/ci.yml`).                                                               |

---

## 4. Repository Architecture

    root/
    ├── apps/
    │   └── web/
    │       └── app/
    │           ├── dashboard/
    │           │   ├── page.tsx              # Auth-protected dashboard
    │           │   └── generate/page.tsx     # Structured speech form → API
    │           ├── speechwriter/page.tsx     # Internal debug surface
    │           ├── api/speechwriter/route.ts # POST → runSpeechwriterPipeline
    │           ├── login/, callback/         # Supabase auth
    │           ├── layout.tsx, globals.css
    │           └── ...
    ├── pipeline/
    │   ├── runSpeechwriter.ts
    │   ├── planner.prompt.ts
    │   ├── drafter.prompt.ts
    │   ├── judge.prompt.ts
    │   ├── guardrail.prompt.ts
    │   └── editor.prompt.ts
    ├── docs/
    │   ├── spec.md
    │   └── changelog.md
    └── sql/seed.sql (auth + profiles)

**Stack:** Next.js 14 (App Router) · TypeScript · Supabase (PostgreSQL + RLS) · Tailwind · OpenAI API.

---

## 5. Data Contracts

### 5.1 Input (Client → API)

    {
      brief: string;               // required ≤2000 chars
      audience?: string;
      eventContext?: string;
      tone?: string;
      duration?: string;
      keyPoints?: string;          // "must include"
      redLines?: string;           // "must avoid"
    }

### 5.2 Internal Config Type

    type SpeechConfig = {
      audience?: string;
      eventContext?: string;
      tone?: string;
      duration?: string;
      keyPoints?: string;
      redLines?: string;
    };

### 5.3 Planner Output Schema

    {
      coreMessage: string;
      audience: string;
      eventContext: string;
      tone: string;
      duration: string;
      pillars: { title: string; summary: string }[];
      constraints: {
        mustInclude: string[];
        mustAvoid: string[];
      };
    }

---

## 6. Pipeline Stages (Logical Contract)

### 6.1 Planner

- Synthesises structured JSON plan.
- If conflict between free text & config → config wins.
- No invented facts.

### 6.2 Drafter

- Generates two alternative drafts (`draft1`, `draft2`).
- Each adheres to planner JSON.
- Output parsed to plain text.

### 6.3 Judge

- Evaluates both drafts vs planner.
- Criteria: message fit · constraints · clarity · tone · length.
- Returns JSON:
  { winner: 1 | 2; reason: string }

### 6.4 Guardrail (MVP)

- Placeholder returning `"OK"`.
- Will evolve to enforce factual, tonal, and taboo constraints.

### 6.5 Editor

- Final polish for spoken delivery:
  - Short sentences · clear rhythm · strong open / close.
  - No new information beyond previous stages.

---

## 7. Orchestrator — `runSpeechwriterPipeline`

    runSpeechwriterPipeline(
      userBrief: string,
      config?: SpeechConfig
    ): Promise<{
      finalSpeech: string;
      planner: any;
      judge: { winner: number; reason: string };
      trace: { stage: string; message: string }[];
    }>

**Responsibilities**

- Validate input and API keys.
- Call each stage sequentially.
- Parse / recover from JSON errors.
- Push readable messages into `trace[]`.
- Return canonical response to API layer.

**Trace Example**

    [
      { stage: "planner",   message: "Planner JSON parsed OK" },
      { stage: "drafter",   message: "2 drafts generated" },
      { stage: "judge",     message: "Draft 1 selected – clearer, stronger tone" },
      { stage: "guardrail", message: "Guardrail OK" },
      { stage: "editor",    message: "Final speech ready" }
    ]

---

## 8. API Route — `/api/speechwriter/route.ts`

1. Validate request (brief present ≤2000 chars).
2. Build `SpeechConfig`.
3. Call `runSpeechwriterPipeline(brief, config)`.
4. Return `{ finalSpeech, trace, planner, judge }`.
5. In Phase C₂, append DB insert for persistence.

---

## 9. Front-End Behaviour

### `/dashboard/generate`

- Auth-protected form.
- Fields: core brief + six constraints.
- Shows stage indicator while running.
- Returns final speech + optional trace.
- Validates client-side length; disables submit if invalid.

### `/speechwriter`

- Internal debug version.
- Always visible trace; used for pipeline QA.

---

## 10. Design Principles

1. **Single Orchestrator Pattern** — all logic flows through one function.
2. **Transparency without noise** — traces exist but remain optional.
3. **Constraint-Driven Generation** — explicit mustInclude / mustAvoid.
4. **Fail-Safe Defaults** — handle malformed JSON gracefully.
5. **Composable** — future products reuse the same interfaces.
6. **Human-Centric Delivery** — optimise outputs for clarity, not token count.
7. **Aesthetic Discipline** — minimal, functional UI until full design pass.

---

## 11. Forward Roadmap

| Phase  | Title                            | Goals                                                                                                        |
| ------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **C₂** | **Run History & Persistence**    | Add `/dashboard/history` + Supabase `speeches` table to store past runs (brief, config, output, trace meta). |
| **D**  | **Admin / Observer Console**     | Inspect all runs, traces, prompt versions, model usage.                                                      |
| **E**  | **Guardrail v1**                 | Real rule checking (no taboo topics, plausibility test, tone safety).                                        |
| **F**  | **Micro-Factory Generalisation** | Extract pipeline library → apply to Decision Engine, Perspective Engine, etc.                                |

---

## 12. Strategic Note

Speechwriter is not the end product; it is the **live reference implementation** of the Micro-Factory approach:

- Policy and structure first.
- Transparent pipelines.
- Clean contracts between UX and orchestration.
- Easy to extend into a portfolio of focused AI tools.

All subsequent work should preserve this pattern.

### v1.4 Addendum — Persistence & History

- Introduced `public.speeches` table with `user_id` FK to `auth.users`.
- RLS:
  - Insert / select / update / delete limited to `auth.uid() = user_id`.
- `/api/speechwriter` on successful run:
  - Inserts `{ user_id, brief, audience, event_context, tone, duration, key_points, red_lines, final_speech, planner, judge, trace }`.
  - Adds a `persistence` trace message describing outcome.
- `/dashboard/history`:
  - Auth-protected list of user’s speeches (most recent first).
  - Click-through to `/dashboard/history/[id]` for full view.
- This cements Speechwriter as a returning workspace, not a one-shot demo.
