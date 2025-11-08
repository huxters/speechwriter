# Speechwriter — Micro-Factory MVP

**Speechwriter** is the first live implementation of the **Micro-Factory System** — a framework for producing founder-grade AI products from shared scaffolding.

It demonstrates how a modular LLM pipeline (Planner → Drafter → Judge → Editor → Guardrail) can be combined with a modern web stack to create explainable, human-in-the-loop reasoning systems.

---

## 🧭 Project Overview

The Micro-Factory enables a small, high-calibre team to move from idea → prototype → production in weeks.  
Each product built with it inherits:

- **Structured reasoning** through prompt pipelines
- **Aesthetic and operational integrity**
- **Explainable architecture**
- **Founder-grade tooling** (pnpm workspaces, admin console pattern, version discipline)

Speechwriter proves the system end-to-end and will serve as the _template repo_ for future factory builds.

👉 **Full specification:** [docs/spec.md](./docs/spec.md)

---

## 🧠 Architecture Snapshot

| Layer              | Purpose                                        |
| ------------------ | ---------------------------------------------- |
| **Planner**        | Turns briefs into structured JSON intent maps  |
| **Drafter**        | Generates multiple candidate drafts            |
| **Judge / Scorer** | Evaluates and selects the best draft           |
| **Editor**         | Refines tone, rhythm, and delivery             |
| **Guardrail**      | Placeholder for factual/tone checks            |
| **Admin Console**  | Provides identity, routing, and log management |

---

## ⚙️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL + RLS)
- **Auth:** Supabase Magic Link (Email OTP)
- **Styling:** Tailwind CSS
- **Package Manager:** pnpm (Workspace mode)

---

## 🚀 Setup

### Prerequisites

- Node.js ≥ 22.0.0
- pnpm ≥ 8.0.0
- Supabase project with anon key

### 1. Environment Variables

Create `apps/web/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```
