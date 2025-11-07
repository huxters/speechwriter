// apps/web/lib/auth/isAdmin.ts

/**
 * Admin authentication helper.
 * Works in both server and client:
 * - Uses NEXT_PUBLIC_ADMIN_EMAILS for client-side checks (for showing links)
 * - Falls back to ADMIN_EMAILS on the server if needed
 */

const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.ADMIN_EMAILS || '';

const ADMIN_EMAILS = raw
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(Boolean);

/**
 * Returns true if the supplied email belongs to an admin.
 */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Expose the resolved admin list (mainly for debugging / tooling).
 */
export const ADMIN_LIST = ADMIN_EMAILS;
