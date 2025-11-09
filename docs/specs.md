# 🧩 Speechwriter Project Roadmap — Updated (v2.0 Architecture)

> _The human soul makes the choice; the machine mind makes the thinking sharper._

---

## Phase A — Functional Scaffolding ✅ _Complete_

**Objective:** Build a stable application shell to support all future functionality.

**Delivered:**

- Next.js 14 app with Supabase authentication (login, dashboard, RLS).
- Database schema and secure persistence foundation.
- Local dev workflow standardised (`Start Web` / `Stop Server`).
- Baseline Supabase setup verified with user-level data isolation.

**Outcome:**  
A production-grade foundation for iterative development — no prototype fragility.

---

## Phase B — Core Pipeline Integration ✅ _Complete_

**Objective:** Transform a brief into a structured, optimised speech via modular pipeline.

**Delivered:**

- Planner → Drafter → Judge → Editor pipeline implemented and stable.
- Structured JSON planning and reasoning chain.
- Two-draft generation with stylistic diversity.
- Judge selection with reasoning trace and reduced position bias.
- Spoken-delivery Editor pass for concision and clarity.

**Outcome:**  
A functional “micro-factory” capable of consistently producing, evaluating, and refining speeches.

---

## Phase C — Stability, Persistence & Guardrails ✅ _Complete_

**Objective:** Make generation safe, observable, and durable.

**Delivered:**

- Guardrail v1 (tone and taboo filters; must-include / must-avoid logic).
- Full pipeline trace logging at every stage.
- Supabase persistence for all runs (brief, plan, drafts, trace, final speech).
- User history interface (`/dashboard/history`).
- Reproducible local development and clean Git/GitHub workflows.

**Outcome:**  
Every run is now recoverable, inspectable, and reproducible.

---

## Phase D — Control, Feedback & Intelligence Loop 🟡 _In Progress_

**Objective:** Give administrators and users transparency, configurability, and a feedback loop that strengthens system quality over time.

### D.1 — Admin / Observer Console ✅

- Internal visibility into pipeline traces, drafts, and judge reasoning.
- Secure admin-only access (email-based restriction).
- Full-run comparison view (Draft 1 vs Draft 2 + final speech).

### D.2 — Guardrail Console 🔜 _(Next Build)_

- Admin-editable must-include / must-avoid rules.
- Persisted guardrail sets per user / global scope.
- Pipeline reads live configuration from Supabase.
- Visualises rule hits or misses in `/admin`.

### D.3 — Dual-Draft Feedback Loop 🆕

- Show both drafts side-by-side to end users.
- Capture user choice vs. judge choice in Supabase (`feedback` table).
- Compute agreement rate and confidence metric.
- Enables long-term model improvement.

### D.4 — Confidence & Plan Transparency 🆕

- Display judge confidence score (e.g., 87/100).
- Reveal Planner summary (core message, pillars, risks).
- Supports learning and trust in the system.

**Outcome:**  
Moves from “black-box AI” to a transparent, learnable decision engine.

---

## Phase E — Product Experience & Expression Layer ⏳ _Upcoming_

**Objective:** Elevate user experience from functional to elegant; express the system’s intelligence with polish and simplicity.

### E.1 — Conversational Input & Pre-Parser 🆕

- Replace multi-field form with a single conversational text box.
- Optional voice-to-text input.
- Auto-extracts key parameters (goal, tone, audience, duration).
- Prompts for any missing info dynamically.

### E.2 — UX Polish (Regenerate, Reveal, Theme) 🆕

- “Regenerate” button for replaying the full pipeline.
- Progressive reveal animation for each pipeline stage.
- Light / Dark theme toggle for comfort and professionalism.

### E.3 — Export & Share 🆕

- Save or share generated runs as PDF or shareable links.
- Branded output for presentations or collaboration.

**Outcome:**  
Transforms Speechwriter from a technical tool into a refined, user-centric product.

---

## Summary Timeline (Indicative)

| Phase | Status         | Duration | Key Milestone                     |
| ----- | -------------- | -------- | --------------------------------- |
| **A** | ✅ Complete    | 2 days   | Functional scaffolding finished   |
| **B** | ✅ Complete    | 2 days   | Full pipeline integration         |
| **C** | ✅ Complete    | 1.5 days | Persistence & Guardrails          |
| **D** | 🟡 In Progress | ~3 days  | Guardrail console + feedback loop |
| **E** | ⏳ Pending     | ~3 days  | Conversational input + UX polish  |

**Next milestone:**  
`v1.6 — Admin Guardrail Console` → unlocks configurable safety and policy controls.

---

**Long-term Vision:**  
A modular _Decision Optimisation Engine_ for spoken communication —  
able to explain, learn, and improve through every user interaction.

---
