# Speechwriter Specification

**Version:** v1.5.2  
**Updated:** 10 November 2025  
**Owner:** Halo MicroFactory

---

## 1. Overview

**Speechwriter** is a multi-agent system that converts a user’s natural brief into a world-class spoken draft through a structured pipeline:  
**Preparser → Planner → Drafter → Judge → Guardrail → Editor → Persistence.**

It supports both **anonymous** and **authenticated** users and is designed around a principle of _one-shot usability_ — the user should be able to type (or speak) a single sentence and receive a professional, speech-ready output. Context and history enhance, but are never required.

---

## 2. Product Principles

1. **Always one-shot usable.** A first-time user gets value immediately.
2. **Context only enhances.** Profile, presets, or memory should add precision, not friction.
3. **Implicit > Explicit.** Infer from behaviour before asking for data.
4. **Simplicity over configuration.** No menus, toggles, or setup before the first run.
5. **Transparency for builders.** Every pipeline stage is traceable in the Admin console.

---

## 3. Current Architecture

### 3.1 Core Pipeline

| Stage           | Purpose                                                                    | Key Output               |
| --------------- | -------------------------------------------------------------------------- | ------------------------ |
| **Preparser**   | Analyse raw brief text to extract intent, audience, tone, and duration.    | Structured `config.json` |
| **Planner**     | Generate a logical plan using templates and presets.                       | JSON Plan                |
| **Drafter**     | Produce two independent candidate drafts from the plan.                    | `draft_1`, `draft_2`     |
| **Judge**       | Evaluate and select a winner using clarity, emotional tone, and alignment. | Winner + rationale       |
| **Guardrail**   | Validate against “must include / must avoid” rules.                        | Pass / Fail + notes      |
| **Editor**      | Optimise winning draft for spoken delivery.                                | Final speech             |
| **Persistence** | Store all pipeline results in Supabase (with anon or user ID).             | DB record                |

---

### 3.2 Preset & Profile System

| Component                   | Function                                                                                           |
| --------------------------- | -------------------------------------------------------------------------------------------------- |
| **Preset Matcher**          | Maps briefs to contextual families (e.g. _student statement_, _founder update_, _board address_).  |
| **Implicit Profile Engine** | Builds ephemeral user profiles from input text + behaviour, refreshed each session for anon users. |
| **Memory Layer (Planned)**  | Associates repeated users or logged-in sessions with persistent stylistic preferences.             |

---

## 4. User Experience

### 4.1 PromptBar v1 — Rectangular Edition

- ChatGPT-style input rectangle with rounded corners and soft grey interior.
- Bottom-aligned action icons:
  - ➕ Upload / attach
  - 🎙 Microphone (voice input)
  - 💬 Conversation mode
- Strong black/grey contrast for icon clarity.
- Placeholder rotates between guiding questions:
  > “What do you want to create?”  
  > “Who’s it for?”  
  > “Any constraints or key themes?”

### 4.2 Output Panel

- Displays **Draft 1**, **Draft 2**, and **Final (Edited)** speech.
- Clean 2-column layout; only one draft per column.
- “Lock Selection” and “Regenerate” buttons planned for next phase.

---

## 5. Persistence & Identity

| User Type         | ID Source                        | Stored Data                             | Retention                          |
| ----------------- | -------------------------------- | --------------------------------------- | ---------------------------------- |
| **Anonymous**     | Auto-generated `anonId` (cookie) | Brief, drafts, final speech (temporary) | Cleared on browser reset / 30 days |
| **Authenticated** | Supabase Auth `user.id`          | All pipeline data + metadata            | Persistent                         |

_Anon IDs enable multi-interaction sessions without formal sign-in._

---

## 6. Admin & Instrumentation

| View                            | Purpose                                             | Status           |
| ------------------------------- | --------------------------------------------------- | ---------------- |
| **Pipeline Trace**              | Full chronological log of internal stages.          | ✅ Implemented   |
| **History Viewer**              | View saved runs per user / session.                 | ✅ Implemented   |
| **Profile Inference Dashboard** | Tracks accuracy of inferred profiles and presets.   | 🔜 Planned (E.4) |
| **Performance Metrics**         | Latency, guardrail passes, success rate per preset. | 🔜 Planned (E.4) |

---

## 7. Design System Notes

| Element          | Current Spec                                                              | Global Rule            |
| ---------------- | ------------------------------------------------------------------------- | ---------------------- |
| **PromptBar**    | Grey #F8F8F8 bg, border #D1D1D1, radius 0.75 rem, padding 1 rem × 1.5 rem | Frozen design pattern  |
| **Primary Text** | Inter / Sans 16 px – 20 px line height                                    | Consistent across apps |
| **Buttons**      | Icons in 40 px circle (#000 / #FFF hover)                                 | Minimal motion         |
| **Panels**       | 2-column grid (drafts) + single row (final)                               | Adaptive to viewport   |

---

## 8. Changelog

### v1.5.2 (10 Nov 2025)

**Added**

- Preparser engine for intent and metadata extraction.
- Preset catalog with auto-matching (e.g. student / founder).
- Supabase persistence for anon and logged users.

**Changed**

- PromptBar v1 (Rectangular Edition): new geometry + bottom-icons.
- runSpeechwriter.ts rewritten for stable persistence and guardrail fallbacks.

**Fixed**

- Guardrail validation failures no longer break pipeline.
- Database schema synchronised (`brief`, `draft_1/2`, `final_speech`).

---

## 9. Next Phase Roadmap

### **Phase E.3 – User Profile and Memory Intelligence**

- Real-time profile learning and context retention across sessions.
- Lightweight clarifier UX (“Did you mean…?” prompt).
- Regeneration and “lock choice” mechanics in Output Panel.
- Begin admin instrumentation for profile and preset accuracy tracking.

### **Phase E.4 – Analytics and Performance**

- Aggregate cross-user metrics on profile inference accuracy.
- Dashboards for guardrail performance, generation latency, and preset hit rates.

---

## 10. Strategic Context

Speechwriter v1.5.2 marks the completion of **Phase E.2 (Profile & Preset Intelligence)** and locks the **PromptBar v1** interface as a canonical pattern for all Micro-Factory tools.  
This release stabilises the core pipeline, introduces structured understanding of briefs, and lays the foundation for learning profiles and persistent personalisation in Phase E.3.

> “The human soul makes the choice; the machine mind makes the thinking sharper.”

---
