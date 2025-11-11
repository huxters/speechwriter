# 🧠 Speechwriter Project Specification

**Version:** v1.5.3 (Phase E.3 – Profile Memory & Context Learning)  
**Date:** November 2025

---

## 🔍 Project Overview

Speechwriter is the reference implementation for the **Micro-Factory system**, designed to demonstrate how a modular LLM pipeline can generate, judge, and refine high-quality documents — from speeches to personal statements to board briefings — with privacy, explainability, and structured intelligence.

It is the first production-grade product under the Micro-Factory umbrella: **a conversational, profile-aware writing assistant** that turns abstract briefs into polished, live-delivery-ready text.

> **Guiding Principle:**  
> _Always one-shot usable. Context only ever enhances._

---

## 🧩 Architecture Summary

| Layer                  | Role                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------- |
| **Frontend (Next 14)** | Conversational interface, admin observer, history, prompt management                  |
| **API Routes**         | Orchestrate the Planner → Drafter → Judge → Guardrail → Editor → Persistence pipeline |
| **Pipeline Directory** | Holds all structured prompt logic (TypeScript + system prompts)                       |
| **Supabase**           | Authentication, persistence (speeches, history, profiles, memory)                     |
| **Docs Folder**        | `specs.md` and `changelog.md` — versioned documentation                               |

---

## 📁 Repository Layout (Simplified)

apps/  
 web/  
 app/  
 login/  
 dashboard/  
 generate/  
 history/  
 admin/  
 pipeline/  
 preparseBrief.ts  
 planner.prompt.ts  
 drafter.prompt.ts  
 judge.prompt.ts  
 guardrail.prompt.ts  
 editor.prompt.ts  
 runSpeechwriter.ts  
docs/  
 specs.md  
 changelog.md

---

## ⚙️ Pipeline Logic (Current Version)

1. **Preparser** – parses raw text into structured config (`goal`, `audience`, `tone`, `duration`, `mustInclude`, `mustAvoid`).
2. **Presets** – identifies contextual archetype (`student_personal_statement`, `ceo_allhands`, etc.).
3. **Planner** – builds structured JSON plan.
4. **Drafter** – produces two candidate drafts.
5. **Judge** – selects winner, logs reasoning.
6. **Guardrail** – enforces factual/tone constraints.
7. **Editor** – refines for spoken delivery.
8. **Persistence** – saves run (drafts, final, trace, metadata).
9. **Memory (Phase E.3)** – updates lightweight user-trait memory to improve future outputs.

Each stage appends to the `trace` array for Admin visibility.

---

## 🧱 Phase Progression Summary

| Phase   | Title                             | Core Deliverable                                | Status           |
| ------- | --------------------------------- | ----------------------------------------------- | ---------------- |
| **A**   | Environment & Scaffolding         | Repo setup + pipeline shell                     | ✅ Done          |
| **B**   | Stabilisation & Core Logic        | Reliable end-to-end run                         | ✅ Done          |
| **C**   | Persistence & Admin               | Supabase persistence + admin routes             | ✅ Done          |
| **D**   | Intelligence & Observer Tools     | Dual-draft system + feedback logging + observer | ✅ Done          |
| **E.1** | Conversational Interface          | ChatGPT-style PromptBar + UI polish             | ✅ Done          |
| **E.2** | Profile & Preset Intelligence     | Preparser + implicit role detection + presets   | ✅ Done (v1.5.2) |
| **E.3** | Profile Memory & Context Learning | Evolving implicit memory per user               | 🔄 In Progress   |
| **E.4** | Analytics & Admin Instrumentation | Aggregated metrics on memory & accuracy         | ⏳ Planned       |
| **E.5** | Deployment                        | Hosted test site for real users (e.g. Dan)      | ⏳ Planned       |

---

## 🧠 Phase E.3 – Profile Memory & Context Learning

### Objective

Move from “smart per-run” to “quietly compounding intelligence per user” without adding friction.  
Speechwriter should **remember** patterns (tone, role, preferred length, taboos) and use them to sharpen future outputs — all while preserving one-shot usability.

### Design Principles

1. **No extra forms** – memory is implicit; explicit profile optional.
2. **Soft influence only** – memory biases defaults; never overrides user input.
3. **Per-identity basis** – keyed by `user_id` or `anon_id`.
4. **Explainable to admins** – every trait viewable via Admin Console.
5. **Revocable** – ability to reset/forget a user memory later.

### Implementation Scope

#### Database Layer

The following SQL defines the `speechwriter_memory` table and applies secure access policies.

create table if not exists speechwriter_memory (  
 id uuid primary key default gen_random_uuid(),  
 user_id uuid references auth.users(id),  
 anon_id text,  
 traits jsonb not null default '{}'::jsonb,  
 runs_count integer not null default 0,  
 last_updated timestamptz not null default now()  
);

create unique index if not exists idx_speechwriter_memory_user_id  
 on speechwriter_memory(user_id) where user_id is not null;

create unique index if not exists idx_speechwriter_memory_anon_id  
 on speechwriter_memory(anon_id) where anon_id is not null;

alter table speechwriter_memory enable row level security;

do $$  
begin  
 if not exists (  
 select 1 from pg_policies  
 where tablename = 'speechwriter_memory'  
 and policyname = 'service_role_full_access_speechwriter_memory'  
 ) then  
 create policy service_role_full_access_speechwriter_memory  
 on speechwriter_memory  
 for all  
 using (auth.role() = 'service_role')  
 with check (auth.role() = 'service_role');  
 end if;  
end$$;

#### Server Logic

- On **new run**:  
  `loadMemory(userId | anonId)` → inject traits into Preparser / Planner.
- On **successful completion**:  
  derive new traits (average tone, length, topic) → `upsertMemory`.
- Store aggregate metadata: `runs_count`, `last_updated`.

#### Admin Integration

- Add read-only memory view in Admin Console.
- Later (Phase E.4): aggregate metrics showing improvement in inferred tone/role accuracy.

### Productisation & Access Control

**Status:** ✅ Landing + Login Flow Complete  
**Next:** E4 Admin Intelligence Console & Voice / PDF Extensions---

## 🧭 Future Outlook (Beyond E.3)

1. **Phase E.4 – Analytics & Admin Instrumentation**  
   Aggregate statistics on how well Speechwriter is inferring user intent and applying memory traits.

2. **Phase E.5 – Deployment**  
   Public test site for Dan and other early users.  
   Authentication, Supabase hosting, custom domain, and telemetry setup.

---

**End of Document**
