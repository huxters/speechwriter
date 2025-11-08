# Micro-Factory / Speechwriter — Changelog

### v1.0 — 2025-11-08

**Overview**

- First full specification of the Micro-Factory System documented (`/docs/spec.md`)
- README replaced with founder-level summary and technical setup alignment
- Base repository scaffolding confirmed (pnpm workspace, admin console pattern)
- Documentation folder created (`/docs`)
- Changelog tracking initiated

**Current Phase**

- Phase A — _Foundational Scaffolding_  
  Status: In progress  
  Next: Verify dev environment runs cleanly and add minimal pipeline files

### v1.1 — 2025-11-08

**Overview**

- Added `/speechwriter` MVP page using full Planner → Drafter → Judge → Guardrail → Editor pipeline
- Added trace visibility for all pipeline stages
- Introduced validation for brief length and clearer error handling

**Current Phase**

- Phase B — Functional MVP
- Phase B.1 — Stabilisation complete

### v1.2 — 2025-11-09

- Updated spec.md to include Phase C₀ plan
- Unified dashboard/generate route
- Wired `/dashboard/generate` to the live Speechwriter pipeline (`/api/speechwriter`)
- Added live stage indicator for Planner → Drafter → Judge → Guardrail → Editor during generation
- Added optional debug trace toggle on the dashboard generate page
- Kept `/speechwriter` as an internal/debug route using the same pipeline

**Current Phase**

- Phase C₀ — Productise MVP: Complete
- Next: Phase C — use structured inputs and clearer constraints to improve pipeline intelligence
