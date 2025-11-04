# SpeechWriter

SpeechWriter helps professionals & students turn key messages into polished written speeches and a spoken "for-the-ear" track.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Magic Link (Email OTP)
- **Styling**: Tailwind CSS

## Setup

### Prerequisites

- Node.js >= 22.0.0
- pnpm >= 8.0.0
- A Supabase project

### 1. Environment Variables

Create a `.env.local` file in `apps/web/` with the following variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Important**: Never expose your `SERVICE_ROLE` key in client-side code. Only use the `ANON_KEY` for client-side operations.

### 2. Database Setup

1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `sql/seed.sql` into the editor
4. Run the SQL script

This will create:
- A `profiles` table with columns: `id`, `role`, `full_name`, `created_at`
- Row Level Security (RLS) policies that allow users to:
  - Select their own profile
  - Insert their own profile
  - Update their own profile

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Run Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## Testing the Auth Flow

1. **Landing Page** (`/`): 
   - If not authenticated: Shows "Get Started" button linking to `/login`
   - If authenticated: Shows "Go to Dashboard" button

2. **Login Page** (`/login`):
   - Enter your email address
   - Click "Send magic link"
   - Check your email for the magic link
   - Click the link in the email

3. **Callback** (`/callback`):
   - Automatically handles the OAuth callback
   - Creates a profile entry if it doesn't exist
   - Redirects to `/dashboard`

4. **Dashboard** (`/dashboard`):
   - Protected route (requires authentication)
   - Shows user email, role, and full name
   - Includes a logout button
   - Unauthenticated users are redirected to `/login`

5. **Header**:
   - Shows Login button when not authenticated
   - Shows user email, Dashboard link, and Logout button when authenticated

## Project Structure

```
apps/web/
├── src/
│   ├── app/
│   │   ├── callback/          # Auth callback route handler
│   │   ├── dashboard/          # Protected dashboard page
│   │   ├── login/              # Login page
│   │   ├── layout.tsx          # Root layout with Header
│   │   └── page.tsx            # Landing page
│   ├── components/
│   │   ├── Header.tsx          # App header with auth state
│   │   └── LogoutButton.tsx    # Client-side logout button
│   └── lib/
│       └── supabase/
│           ├── client.ts       # Browser Supabase client
│           └── server.ts       # Server Supabase client
└── sql/
    └── seed.sql                # Database schema and RLS policies
```

## Authentication Flow

1. User enters email on `/login`
2. Supabase sends magic link email
3. User clicks link → redirected to `/callback?code=...`
4. Callback route exchanges code for session
5. Profile is automatically created/updated if needed
6. User is redirected to `/dashboard`
7. Dashboard checks session server-side and redirects to `/login` if unauthenticated

## Profile Auto-Creation

When a user logs in for the first time, a profile row is automatically created in the `profiles` table with:
- `id`: User's UUID from `auth.users`
- `role`: Default value `'user'`
- `full_name`: Derived from email (username part before @)
- `created_at`: Current timestamp

Subsequent logins will update the existing profile if needed (via upsert).

## Security Notes

- All Supabase operations use the `ANON_KEY` (never `SERVICE_ROLE` on client)
- Row Level Security (RLS) policies enforce user-level data access
- Server-side session checks protect routes
- Magic link authentication is handled securely by Supabase


