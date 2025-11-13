# Speechwriter – Changelog

_Last updated: 2025-11-13_

This changelog records all meaningful product, UI, and pipeline developments from the start of the project to the current MVP + Refinement v1 milestone.

---

## 2025-11-13 — Refinement Engine v1 + Major UX Update

### **Highlights**

- Introduced **Refinement Mode v1**, enabling controlled, stable iterative editing.
- Speechwriter now detects whether the user wants a **new speech** or a **refinement**.
- Refinement changes **only** the requested areas and preserves all other content.
- This makes Speechwriter significantly more stable and predictable than ChatGPT.

### **Pipeline Changes**

- Added `previousVersionText` and `previousRequestText` to API + pipeline input.
- Added `decideMode()` function with new-speech detection heuristics.
- Added dedicated **refiner** system prompt:
  - Enforces locality of edits.
  - Prevents drift, topic change, or full rewrites.
  - Only modifies what user asked for.
- Added `mode: 'generate' | 'refine'` to all pipeline traces.
- Added persistence + memory handling for refinement runs.
- Full generate pipeline remains unchanged.

### **UX Changes**

- Lozenge updated to full ChatGPT-style:
  - "+" upload icon
  - Microphone icon
  - Circular submit arrow
  - Proper alignment + hover tooltips
  - Auto-grow with text
- Output thread updated:
  - Newest version at the top
  - Request strip added (“Request — vN”)
  - Consistent toolbars (copy / pdf / speak)
- Narration feed added:
  - Single-line stage updates replacing progress bar
- Output thread no longer clears between runs
- Older versions remain scrollable in a threaded history

### **Impact**

This is the point where Speechwriter becomes an **iterative writing environment**, not a prompt wrapper.  
Users can now reliably ask for:

- “Keep everything the same except…”
- “Only change paragraph 2…”
- “Add a sentence to the closing…”  
  Without fear of document drift.

---

## 2025-11-12 — Lozenge Freeze + Icon Unification

- Lozenge visually matched to ChatGPT:
  - Consistent radius, padding, icon weights
  - Stable hover behaviour
- Button icons reconciled across app:
  - Copy / export / TTS icons replaced with unified variants
  - Removed truncation issues
- Tooltip text added for all interactive icons
- Lozenge frozen as a design component (per MicroFactory standard)

---

## 2025-11-11 — Version Thread + Request Strip

- Introduced `OutputThread` to display multiple versions.
- Updated `VersionCard` to include request text (“Request — vN”).
- Toolbar aligned and simplified; icons resized and standardised.
- Version ordering: newest on top, older below.

---

## 2025-11-10 — Iterative Workflow Foundations

- Implemented multi-version thread rendering.
- Added version numbers: v1, v2, v3…
- Added PDF export fallback for browsers without jsPDF.
- Added TTS playback via `SpeechSynthesisUtterance`.

---

## 2025-11-09 — UI Polish Round 1

- Initial progress bar removed.
- Added narration feed concept (one-line changing status).
- Header layout stabilised.
- Early cleanup of inconsistent font sizes.

---

## 2025-11-07 — Pipeline Stability & Observability

- Added comprehensive `trace[]` to pipeline results.
- Introduced more robust error handling for:
  - Planner
  - Drafter
  - Judge
  - Guardrails
  - Editor
- Added persistence for all generate-mode runs.
- Added memory trait inference per run (early prototype).

---

## 2025-11-06 — Base MVP Pipeline Completed

### **Pipeline Created**

- Preparser
- Preset matcher
- Planner (plan JSON)
- Dual-draft generator
- Judge/scorer
- Guardrail (safety + tone compliance)
- Performance Editor v1

### **Outcome**

- Pipeline consistently outperforms raw LLM prompting.
- Deterministic planning → structured drafts → judged best → safety check → edited output.

---

## 2025-11-05 — Initial Layout & Generate Page

- Created `/dashboard/generate`.
- Implemented basic PromptBar and button.
- Added early trace output.
- Added static Draft 1 / Draft 2 panels.

---

## 2025-11-03 — Project Setup

- Next.js + Supabase initialisation.
- Added server-side Supabase client.
- Added basic `/api/speechwriter` route.
- Added project scaffolding for MicroFactory compliance.

---

# Summary of Evolution

| Date       | Milestone                                               |
| ---------- | ------------------------------------------------------- |
| Nov 3      | Project foundation (Next.js + Supabase)                 |
| Nov 5      | Draft generation UI                                     |
| Nov 6      | Full structured pipeline (MVP)                          |
| Nov 7      | Observability + persistence                             |
| Nov 9–11   | Major UI improvements + iterative workflow              |
| Nov 12     | Lozenge & icon freeze                                   |
| **Nov 13** | **Refinement Engine v1 shipped (major differentiator)** |

---

# Current Version: MVP + Refinement v1 Complete

The next major milestone is:

### **Post-MVP Editing Engine**

- Sentence-anchored IDs
- JSON patch generation
- Micro-diff smoothing
- Paragraph-level lock guarantees
- Full alignment with MicroFactory editing standards

This will turn Speechwriter into the first **precision writing engine** powered by LLMs.
