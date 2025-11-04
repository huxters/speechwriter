# ARCHITECTURE.md

## 1) Purpose (one screen)
**Speechwriter** converts intent into two premium outputs:
1. a **written speech** (rhetorically structured, print/web ready)  
2. a **spoken performance** (audio mastered with intro/outro motif)

Non-negotiables: privacy, craftsmanship, reliability.

---

## 2) Top-level layout

speechwriter/  
  apps/  
    web/   # Next.js UI (public + admin)  
    api/   # Fastify HTTP API (jobs, profiles, artifacts)  
    worker/ # BullMQ workers (LLM, PDF, audio)  
  packages/  
    auth/   # AuthService interface & adapters (stubbed in MVP)  
    policies/ # RBAC/ABAC check(user, action, resource)  
    redaction/ # preparePrompt(); masking/aliasing; audit hook  
    config/  # env schema (zod), feature flags (STRICT_MODE)  
  infra/  
    docker/  # docker-compose.dev.yml (Redis, Postgres) [optional in MVP]  
  .devcontainer/ # reproducible dev env (Node 22, pnpm)  
  .vscode/    # one-click tasks (Start Web/API/Worker/Dev Stack)  
  .github/workflows/ci.yml # CI build/test/lint  
  .cursor/rules  # AI guardrails (privacy/architecture)

**One sentence mental model:**  
UI talks to **API**, API enqueues jobs to **Worker**, Worker creates **artifacts** (PDF/MP3) and stores metadata in DB.

---

## 3) Data & queues (minimum viable)

**Database (Postgres):**
- orgs(id, name, …)
- users(id, org_id, role, …)
- profiles_public(id, org_id, name, role, company, …)
- profiles_secure(profile_id FK, encrypted_json) ← field-level encryption
- speech_jobs(id, org_id, profile_id, status, preset, created_at, …)
- artifacts(id, job_id, kind enum[written, spoken, pdf, mp3, vtt], url/path, meta)

**Queue (Redis + BullMQ):**
- Queue name: speech-jobs  
- Job payload: { jobId, orgId, profileId, content, preset }

**Artifacts storage:** start local filesystem; swap to S3-compatible in prod.

---

## 4) Privacy & security rails

**Design principle:** *Security-by-design, feature-flagged.*  
Lay the rails now; run permissive until `STRICT_MODE = on`.

- **Auth** (`packages/auth`): `AuthService.getSession(req)` returns {id, orgId, role} or anon. Replace stub with Clerk/Auth0 later without touching app code.  
- **Policies** (`packages/policies`): `can(user, action, resource)`; in MVP returns true unless `STRICT_MODE = on`. Actions: read | create | update | delete | export.  
- **Redaction** (`packages/redaction`): `preparePrompt({ profile, content, purpose, preset })` — masks emails/PII when strict, strips sensitive notes when strict, optional audit hook (append-only log).  
- **DB invariants:** every query is scoped by org_id.  
- **Keys:** no client-side LLM keys; secrets only in server/worker env.  
- **Audit (later):** table to record who/what/when/masked_fields.

---

## 5) LLM orchestration (thin now, extensible later)

- All LLM calls go through **Worker** using `preparePrompt()`.  
- Strategy: simple retry + timeout; later add model router (OpenAI/Anthropic).  
- Output variants:  
 - **Written:** HTML (web/print styles), then HTML → PDF (Playwright).  
 - **Spoken:** ear-first script → TTS (ElevenLabs/coqui) → FFmpeg intro/outro.  
 - **Teleprompter:** WebVTT timing placeholder (fill in later).

---

## 6) “Communication Pack” pipeline (end-to-end)

1. **web** posts `/speech-jobs` with { profile, content, preset } (anonymous allowed in MVP).  
2. **api** validates → `preparePrompt()` preview (for logs) → enqueue `speech-jobs`.  
3. **worker** consumes:  
 - Call LLM(s) → written + spoken drafts  
 - Render `written.html` → `written.pdf`  
 - TTS → `spoken.mp3` (+ motif); emit `spoken.vtt` (stub timing)  
 - Save artifacts and update status completed | failed.  
4. **web** polls `/speech-jobs/:id` and lists download links.  

**Failure states:** job timeout / TTS unavailable → mark failed, return reason.

---

## 7) Feature flags & environments

- `STRICT_MODE = off` (MVP) → permissive RBAC + low redaction  
- `STRICT_MODE = on` (Prod/Enterprise) → enforce can(), high redaction, full audit  
- `AUDIO_ENABLED`, `PDF_ENABLED` toggles for local dev speed  

**Envs:** development, staging, production

---

## 8) Build, run, test (no terminals)

- **Tasks** (in `.vscode/tasks.json`):  
 - Start Dev Stack → docker compose up (Redis/DB)  
 - Start API → apps/api  
 - Start Worker → apps/worker  
 - Start Web → apps/web  
 - Run Tests → monorepo tests  
- **CI** (`.github/workflows/ci.yml`): install, build, lint, test on every PR.

---

## 9) House-style & presets (copy deck)

- **Presets:** Crisp Executive, Warm Founder, Policy Brief (JSON config).  
- LLM prompts include preset instructions (tone, cadence, rhetorical beats).  
- PDF uses matching typography and print CSS.

---

## 10) Ready-to-harden checklist

When turning on enterprise/strict mode:

- [ ] Real Auth adapter (Clerk/Auth0/SAML) plugged into AuthService  
- [ ] can() enforced on API + Worker resource actions  
- [ ] Field-level encryption live for profiles_secure + key rotation plan  
- [ ] Audit log table + export endpoint  
- [ ] S3 artifact storage + signed URLs  
- [ ] Model router with allowlist, retries, cost/time budgets

---

## 11) Future extensions (non-breaking)

- Teleprompter timing engine (align text to speech with word timings)  
- Smart-glasses export (format for supported devices)  
- House-style editor (visual tuning of cadence & motifs)  
- White-label theming per org  
- Multi-tenant analytics (OpenTelemetry + dashboards)

---

## 12) Invariants (Cursor & humans must keep)

- All LLM calls import from @speechwriter/redaction.  
- No secrets in client code.  
- Every DB access includes org_id.  
- Worker executes “dangerous” work; API remains side-effect light.  
- Keep TypeScript strict: true.  
- Tests for policies and redaction must exist and stay green.

---

### End of file.