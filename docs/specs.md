---
version: 1.0
lastUpdated: 2025-11-08
author: Stephen Highlander
status: Active (MVP Alignment)
---

# Micro-Factory System — Top-Down Specification (v1.0)

### _Founder’s Strategy Voice with Technical Appendix_

---

## 1. Founding Vision

The **Micro-Factory** is a system for producing founder-grade AI products from shared scaffolding.  
It fuses craft and code: human design judgement with reproducible technical infrastructure.

Its purpose is to let a small, high-calibre founding team move from idea → prototype → production in weeks, not quarters.  
Each product expresses the same DNA — structured reasoning, aesthetic integrity, explainable architecture, and minimal complexity.  
The first expression is **Speechwriter**, an applied case study demonstrating the Micro-Factory’s core pipeline and environment.

---

## 2. Philosophy and Design Principles

Derived from prior academic prompt-engineering work:

- **Layered Intelligence** — distinct cognitive roles (Planner, Drafter, Judge, Editor, Guardrail) rather than a single monolithic prompt.
- **Explainable Workflows** — every stage emits interpretable outputs (JSON or text).
- **Human-in-the-Loop Mastery** — the human soul makes the choice; the machine mind makes the thinking sharper.
- **Iterative Craft** — prompts, roles, and pipelines are modular, composable, observable.
- **Reusable Scaffolding** — once proven for Speechwriter, it can be cloned to build other products (Decision Engine, Story Composer, etc.).
- **Founder-Grade Execution** — clean repos, reproducible builds, pnpm workspace discipline, `.gitignore` hygiene, admin-console pattern, automated start-up/shutdown flow.

---

## 3. System Architecture Overview

| Layer             | Role       | Function                                                      |
| ----------------- | ---------- | ------------------------------------------------------------- |
| **Planner**       | Strategy   | Converts user briefs into structured intent maps (JSON)       |
| **Drafter**       | Generation | Produces multiple candidate drafts                            |
| **Judge/Scorer**  | Evaluation | Scores and selects best drafts                                |
| **Editor**        | Refinement | Polishes tone, rhythm, and spoken delivery                    |
| **Guardrail**     | Safety     | Placeholder for factual/tone checks                           |
| **Admin Console** | Control    | Shared UI framework for identity, routing, logs, and security |

Each module acts as a **self-contained prompt agent** with defined inputs/outputs for transparent reasoning.

---

## 4. Speechwriter as MVP Implementation

Speechwriter demonstrates the Micro-Factory in action:

- Complete linear prompt pipeline proving the concept.
- Admin environment linking orchestration and monitoring.
- Working pnpm-based repo structure ready for reuse.
- Clear separation between active and scaffolded components.

Its domain (speech creation) is secondary to its architectural value: a living proof that the Micro-Factory pattern works end-to-end.

---

## 5. Current Build Map

| Component             | Status         | Notes                                                |
| --------------------- | -------------- | ---------------------------------------------------- |
| Planner Prompt        | ✅ Complete    | Returns structured JSON for downstream use           |
| Drafter Prompt        | ✅ Complete    | Generates multiple candidate drafts                  |
| Judge/Scorer          | ✅ Working     | Selects and ranks drafts by quality                  |
| Performance Editor    | ✅ Working     | Converts winning draft into final spoken form        |
| Guardrail             | ⚪ Placeholder | Exists as stub for future tone/fact checks           |
| Admin Console Pattern | ⚙️ Scaffolding | Base routes, identity, nav, task management ready    |
| Dev Environment       | ✅ Complete    | pnpm workspace, clean `.gitignore`, start/stop tasks |
| Data & State Layer    | ⚙️ Scaffolding | Ready for profile/persistence integration            |
| Analytics/Logging     | 🔜 Planned     | For evaluation and telemetry                         |

---

## 6. Updated Phase Plan (A–E)

| Phase | Name                          | Description                                               | Output / Acceptance                            |
| ----- | ----------------------------- | --------------------------------------------------------- | ---------------------------------------------- |
| **A** | **Foundational Scaffolding**  | Environment setup, repo hygiene, shared tasks             | Clean repo, working start/stop, admin baseline |
| **B** | **Functional MVP**            | Planner→Drafter→Judge→Editor end-to-end                   | Functional text flow with sample prompts       |
| **C** | **Intelligence Expansion**    | Scoring metrics, adaptive planning, perspective injection | Configurable pipeline, richer evaluation logic |
| **D** | **Admin + Analytics Console** | Dashboard for workflow control, logs, evaluation          | Browser-based console showing run history      |
| **E** | **Production & Replication**  | Profile integration, persistence, cloning template        | Speechwriter ready for use and factory reuse   |

---

## 7. Next-Step Recommendations

1. Add this file to `/docs/spec.md` and link it from `README.md`.
2. Validate Phase B end-to-end flow.
3. Define scope for Phase C adaptive intelligence.
4. Create “Factory Template Repo” from Speechwriter build.
5. Begin internal documentation for prompt files and architecture.

---

## Appendix — Technical-Strategic Reference

**Core Files**
