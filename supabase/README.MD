# 🧩 Supabase Backend Layer — Speechwriter / MicroFactory Standard

This folder defines the **database layer** for the Speechwriter app.  
It is also the **baseline Supabase architecture** used by all MicroFactory products.

---

## 📂 Folder Structure

supabase/  
├── migrations/  
│ └── 20251107_add_subscription_and_token_tracking.sql  
├── config.toml # Optional — used by Supabase CLI  
└── README.md # This file

---

## 🧱 Purpose

This directory stores **version-controlled database migrations** — the SQL scripts that build and evolve your Supabase backend.  
Each file defines **one atomic schema update** (tables, functions, triggers, RLS policies, etc.) and is **idempotent** — safe to run repeatedly.

You can think of this folder as the **source code of your database**, just as `apps/web/` is the source code of your frontend.

---

## ⚙️ Core Concepts

| Component         | Description                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| **Migrations**    | SQL scripts that define all schema changes — created tables, policies, triggers, functions, etc.              |
| **config.toml**   | Optional Supabase CLI configuration file (e.g. project reference ID, database URL).                           |
| **RLS Policies**  | All tables must use **Row Level Security** — this ensures per-user data isolation.                            |
| **RPC Functions** | Custom server-side logic (e.g. `consume_tokens()`, `handle_new_user_subscription()`) lives in the migrations. |
| **Triggers**      | Database automations that respond to events (e.g. create subscription on new signup).                         |

---

## 🪜 How to Apply Migrations

You have two ways to apply migrations:

### 1️⃣ Manual (via Supabase SQL Editor)

1. Copy the contents of the migration file.
2. Open your project in [Supabase](https://supabase.com/dashboard).
3. Go to **SQL Editor → New Query**.
4. Paste and run the SQL.

### 2️⃣ Automatic (using Supabase CLI)

_(Optional — for future automation via Cursor or CI/CD)_

```bash
# Install CLI locally (once)
pnpm add -D supabase

# Link to your project (once)
npx supabase link --project-ref your_project_ref

# Apply all pending migrations
npx supabase db push
```
