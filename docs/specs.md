# Speechwriter – Product Specification (MVP + Refinement v1)

_Last updated: 2025-11-13_

## 0. Purpose & Positioning

Speechwriter is a **professional speechwriting environment** built on top of LLMs.

It is **not** “ChatGPT with a nicer skin”. It is a structured system that:

- Generates high-quality first drafts via a **multi-stage pipeline**
- Provides a controlled, **iterative refinement loop**
- Maintains **stability** and **locality of edits** (“change X, keep everything else the same”)
- Builds towards a **communication intelligence platform** (memory, profiling, multimodal, etc.)

Core positioning:

> **“The human soul makes the choice; the machine mind makes the thinking sharper.”**  
> **“We productise wisdom for high-stakes spoken communication.”**

---

## 1. Core User Story (MVP)

A user can:

1. Describe a speech in one natural message in a **ChatGPT-style lozenge**.
2. Speechwriter runs a structured pipeline:
   - Planner → Dual Drafts → Judge → Guardrail → Editor
3. The user sees:
   - A **Suggested Output – v1** (recommended speech)
   - Underneath: prior versions (if any) and key traces
   - For v1: the original **request text** that produced it
4. The user then iterates in the lozenge:
   - “Add more detail to paragraph 2, keep everything else the same.”
   - “Make the closing 10% more emotional, keep structure identical.”
5. Speechwriter:
   - Uses **Refinement Mode** to edit the previous version in place
   - Produces **v2, v3, …** as new Suggested Outputs
   - Preserves everything outside the requested change as far as possible
6. At any point, the user can:
   - Copy the current version
   - Export to PDF
   - Listen via text-to-speech

This is a **different category** of product from a chat interface: it is an **iterative speech workshop**.

---

## 2. System Overview

### 2.1 High-Level Architecture

- **Frontend (Next.js)**
  - `/dashboard/generate` – main speech generation & iteration UI
  - Components:
    - `PromptBar` – frozen ChatGPT-style lozenge
    - `VersionCard` – renders a single Suggested Output version
    - `OutputThread` – list of versions (newest at top)
    - `VersionToolbar` – copy / export / speak controls
- **Backend**
  - `/api/speechwriter` – API route that:
    - Resolves Supabase user identity
    - Forwards all inputs + refinement context to the pipeline
  - `runSpeechwriterPipeline` – core pipeline orchestrator:
    - `mode: 'generate' | 'refine'`
    - Full multi-stage generation pipeline
    - Lightweight **Refinement Mode v1**
- **Data**
  - Supabase Postgres:
    - `speeches` – stores runs (both generate and refine)
    - `speechwriter_memory` – stores inferred traits per user / anon id

---

## 3. Generation Pipeline (Generate Mode – MVP)

`mode = 'generate'` is used when:

- There is **no previous version** in the current thread, or
- The user explicitly asks for a new speech (e.g. “new speech”, “start again”, “different topic”, etc.)

### 3.1 Preparser

Normalises and enriches the raw brief.  
Non-fatal: failure drops back to raw brief.

### 3.2 Preset Matcher (Soft)

Optional heuristic preset ID that nudges planner tone/structure.

### 3.3 Planner

Converts the brief into structured internal plan JSON:

- `coreMessage`
- `audienceSummary`
- `emotionalArc`
- `pillars[]`
- `risks[]`

### 3.4 Drafter (Dual Drafts)

Generates two diverse drafts for competitive selection.

### 3.5 Judge

Chooses the stronger draft and provides a rationale.

### 3.6 Guardrail

Safety, tone and constraint enforcement; minimal adjustments only.

### 3.7 Editor (Performance Editor v1)

Optimises the winning draft for spoken delivery.

### 3.8 Persistence & Memory

`supabase.speeches` and `speechwriter_memory` updated for each generate run.

---

## 4. Refinement Mode v1 (Iterative Editing)

`mode = 'refine'` is used when:

- A previous version exists, and
- The new request does not match “new speech” intent.

### 4.1 Mode Detection

Keywords → generate  
Otherwise → refine

### 4.2 Behaviour (Refine)

- **Skips** planner, drafter, judge.
- Runs a single **text-model refinement**:

**Rules:**

- Apply only the requested changes.
- Preserve all other content.
- Do not change topic, purpose, or tone.
- Do not create new sections unless explicitly asked.

**Output:**

- Full revised speech.

### 4.3 Persistence & Memory

Refinement runs are saved to `speeches` with `draft_1 = draft_2 = null`.  
Traits may still be inferred from final speech.

---

## 5. Frontend UX – Generate & Iterate

### 5.1 Lozenge (PromptBar)

- ChatGPT-style
- Grows with text
- Icons:
  - “+” (future: upload)
  - microphone
  - circular submit arrow
- Tooltip hints on hover

### 5.2 Narration Feed

Single-line status replacing the progress bar:

- Planning…
- Drafting…
- Judging…
- Guardrail review…
- Polishing…
- “Ask for tweaks, new directions…” when idle.

### 5.3 Version Thread

Newest version at top.

Each version card:

- Header: “Suggested Output — vN”
- Timestamp
- Request strip: “Request — vN”
- Full speech text
- Toolbar: copy / PDF / TTS

### 5.4 User Education

Small helper text:

> For precise edits, try:  
> “Keep everything the same except…”  
> “Only change paragraph 2 by…”

---

## 6. Non-Functional Requirements

- Graceful failure with trace logging
- Fast refinement (single call)
- Observability at each stage
- Deterministic-feeling behaviour in refinement mode
- Full alignment with MicroFactory design standards

---

## 7. Roadmap (After MVP + Refinement v1)

### 7.1 Surgical Patch Engine (Post-MVP)

- Span ID segmentation
- JSON patches for controlled edits
- Git-style diff view
- Locked context verification

### 7.2 Chain-of-Critique Smoother

- Micro-judge detects coherence/tone issues
- Minimal micro-edits to restore flow
- Never rewrites whole sections

### 7.3 Voice & Audience Profiler

- Controls for tone, register, audience type
- Multi-voice rendering

### 7.4 Golden Memory

- User-selected “Gold” outputs
- Embedding-driven improvements
- Stylistic biasing in drafts and editor

### 7.5 Live Guardrails

- Real-time tone drift, taboo detection
- Spoken-delivery pacing warnings

### 7.6 Multimodal Output Layer

- AI narration
- Teleprompter mode
- Slide cue extraction
- PDF booklet export

### 7.7 Feedback Learning Loop

- User ratings
- “Did it land well?” collection
- Adaptive judge calibration

### 7.8 Human-in-the-Loop (Premium)

- Invite reviewer
- Reviewer uses same patch engine
- Collaborative versioning

---

## 8. Strategic Narrative

Speechwriter is evolving from:

> **“A tool that writes speeches”**

to:

> **“A communication intelligence system that helps leaders craft, refine, and deliver messages that matter — with consistency, precision, and trust.”**

The Refinement Engine v1 is the turning point where Speechwriter **surpasses ChatGPT** in professional writing workflows by providing:

- Deterministic edits
- Localised changes
- Versioned iterations
- Structured multi-stage generation

This is the foundation for the full patch-based editing engine in the next phase.
