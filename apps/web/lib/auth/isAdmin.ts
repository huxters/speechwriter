// apps/web/lib/auth/isAdmin.ts

/**
 * Admin email helper.
 *
 * Uses NEXT_PUBLIC_ADMIN_EMAILS as a comma-separated list:
 * NEXT_PUBLIC_ADMIN_EMAILS=alice@example.com,bob@example.com
 */

const RAW = process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';

const ADMIN_EMAILS: string[] = RAW.split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

/**
 * Returns true if the given email is in the configured admin list.
 */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Optional helper if you ever want to inspect current admin list.
 */
export function getAdminEmails(): string[] {
  return ADMIN_EMAILS;
}
