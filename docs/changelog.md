# 🧠 Speechwriter Micro-Factory – Specification (v1.7)

## Overview

Speechwriter is a structured AI writing pipeline that turns unstructured human briefs into high-quality written or spoken outputs. It uses modular reasoning stages — each handled by a specialised LLM prompt — with local persistence, lightweight memory, and transparent admin tooling.

Guiding principle:  
**Always one-shot usable. Context only ever enhances.**  
The system must deliver a great result from a single input, while improving as it learns.

---

## 1. Core System Architecture

| Layer             | Purpose                                                           | Implementation                                                                                         |
| ----------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| UI Layer          | Conversational entry point and output display.                    | apps/web/app/dashboard/generate/page.tsx using modular PromptBar and OutputPanel.                      |
| Pipeline Layer    | Multi-stage orchestration (planning, drafting, judging, editing). | apps/web/pipeline/\*.ts (Planner, Drafter, Judge, Guardrail, Editor, Preparser, Presets, InferTraits). |
| Persistence Layer | Stores completed runs and user memory.                            | Supabase tables: speeches, speechwriter_memory.                                                        |
| Admin Layer       | Observation, debugging, learning analytics.                       | /admin route includes Pipeline Observer + Memory Inspector.                                            |
| Memory Layer      | Lightweight per-identity trait inference (tone, role, domain).    | Embedded via inferTraits + upsertMemoryTraits.                                                         |

---

## 2. High-Level Flow

1. **User Input**
   - User types into the conversational lozenge: “What do you want to create?”
   - Optional hints (audience, tone, duration) may be extracted by the Preparser.

2. **Pipeline Execution**
   /api/speechwriter calls runSpeechwriterPipeline():

   | Stage               | Function                                  | Output                                      | Trace Example                                          |
   | ------------------- | ----------------------------------------- | ------------------------------------------- | ------------------------------------------------------ |
   | Memory Load         | Load traits for user or anon ID.          | Prior tone / domain preferences.            | [memory] Loaded prior memory traits for this identity. |
   | Preparser           | Extract structured config from raw brief. | goal, audience, tone, etc.                  | [preparser] parsed brief into structured config.       |
   | Preset Match (Soft) | Heuristic match to common templates.      | Optional presetId.                          | [presets] matched: student_personal_statement.         |
   | Planner             | Convert config to structured plan JSON.   | planJson (coreMessage, pillars, structure). | [planner] generated structured plan JSON.              |
   | Drafter             | Produce two alternative drafts.           | draft_1, draft_2                            | [drafter] produced 2 drafts.                           |
   | Judge               | Compare drafts and choose winner.         | winner, reason                              | [judge] selected draft 1 — …                           |
   | Guardrail           | Validate and minimally edit winner.       | adjusted_draft, issues_summary              | [guardrail] applied minimal edits.                     |
   | Editor              | Optimise final for spoken delivery.       | Final polished text.                        | [editor] final speech ready.                           |
   | Persistence         | Save run to Supabase.                     | 1 row per run.                              | [persistence] Saved speech to history…                 |
   | Memory Update       | Merge new traits to memory.               | Updated record.                             | [memory] Updated memory traits…                        |

3. **Output to User**
   - Display Draft 1, Draft 2, and Final Speech (Edited).
   - Pipeline trace viewable in Admin Observer.

---

## 3. Data Model

### Table: speeches

| Column       | Type           | Notes                           |
| ------------ | -------------- | ------------------------------- |
| id           | UUID           | Primary key                     |
| created_at   | Timestamp      | Default now()                   |
| user_id      | UUID nullable  | Linked to logged-in user        |
| anon_id      | UUID nullable  | Generated for anonymous visitor |
| brief        | Text           | Raw user brief                  |
| draft_1      | Text           | First draft                     |
| draft_2      | Text           | Second draft                    |
| final_speech | Text           | Editor-refined version          |
| trace        | JSONB          | Stage-by-stage diagnostics      |
| metadata     | JSONB nullable | Reserved for scores, votes      |

### Table: speechwriter_memory

| Column            | Type      | Notes                        |
| ----------------- | --------- | ---------------------------- |
| id                | UUID      | Primary key                  |
| user_id / anon_id | UUID      | Either user or anon identity |
| traits            | JSONB     | Inferred attributes          |
| runs_count        | Int       | Incremented per run          |
| last_updated      | Timestamp | Auto-managed                 |

### Example traits object

    {
      "roles": ["executive"],
      "tonePreferences": ["warm", "clear"],
      "lengthPreference": "medium",
      "presetsUsed": ["exec_update"],
      "domains": ["fintech"]
    }

---

## 4. Prompt Contracts

All stage prompts follow strict JSON contracts:

| Stage     | Export                                     | Expected Output                           |
| --------- | ------------------------------------------ | ----------------------------------------- |
| Planner   | plannerPrompt                              | JSON with coreMessage, pillars, structure |
| Drafter   | drafterPrompt                              | draft_1, draft_2                          |
| Judge     | judgePrompt                                | winner, reason                            |
| Guardrail | guardrailPrompt                            | adjusted_draft, issues_summary            |
| Editor    | editorPrompt                               | Plain text                                |
| Preparser | Function output goal, audience, tone, etc. |

If invalid JSON occurs, the stage logs [stage] failed: and continues gracefully.

---

## 5. Memory & Identity

### Identity Handling

- Logged-in user: resolved via Supabase Auth user_id.
- Anonymous user: assigned UUID anon_id (session cookie).

### Memory Lifecycle

1. Load memory traits at start by user_id or anon_id.
2. Merge inferred traits after run.
3. Increment runs_count.
4. Anonymous memory persists until session expires.

### Trait Inference

Derived from structured plan and final speech:

- Role (CEO, student, founder)
- Tone (warm, formal, inspiring)
- Preferred length
- Domains (education, business, science)
- Preset usage

---

## 6. Admin Console

### Views

| View                 | Purpose                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| Pipeline Observer    | Inspect full trace and stage outputs (plan, drafts, judge, editor).                     |
| Memory Inspector     | View inferred traits and run counts for each identity.                                  |
| Aggregator Dashboard | Summarise preset usage, guardrail pass rate, and average judge–user agreement (future). |

---

## 7. Phase Roadmap

| Phase | Description                                              | Status      |
| ----- | -------------------------------------------------------- | ----------- |
| A     | Environment setup, Supabase link, initial pipeline.      | ✅ Complete |
| B     | Persistence, Admin Console, Stable architecture.         | ✅ Complete |
| C     | Guardrail + Observer integration, error recovery.        | ✅ Complete |
| D     | Feedback loop (judge vs user), dual-draft UI, logging.   | ✅ Complete |
| E1    | Conversational interface with ChatGPT-style lozenge UI.  | ✅ Complete |
| E2    | Profile engine, presets, pre-parser, memory integration. | ✅ Complete |
| E3    | Deployment (Supabase-hosted + Vercel preview).           | 🔜 Next     |
| F     | UX polish, theme switcher, and observability metrics.    | Planned     |

---

## 8. Pending To-Do Items

- UI polish and final theming (lozenge + icons final lock).
- Add aggregate metrics for user vs judge agreement.
- Add profile/preset analytics in admin dashboard.
- Refactor generate/page.tsx and runSpeechwriter.ts into modular subcomponents.
- Implement final deployment pipeline (Vercel + Supabase).
- Add performance monitoring (latency per stage).
- Add data export (PDF/JSON) for saved speeches.

---

## 9. Design Principle Summary

- Always one-shot usable — no mandatory onboarding.
- Context only enhances results — no dependence on form filling.
- Transparency by design — all internal reasoning logged.
- Modularity and replaceability — prompts and models can evolve.
- Profiles remain implicit, adaptive, and privacy-preserving.
- Data is only persisted with explicit or anonymous consent.
- Each stage is observable, testable, and recoverable.

---

_End of file_
