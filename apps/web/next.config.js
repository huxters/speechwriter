/** @type {import('next').NextConfig} */

// -----------------------------------------------------------------------------
// Speechwriter – Next.js config
// Root ("/") serves the public generate experience via app/page.tsx.
// No forced redirect to /login or /dashboard.
// Authentication gating is handled per-route (e.g. /dashboard, /admin).
// -----------------------------------------------------------------------------

const nextConfig = {
  reactStrictMode: true,
};

module.exports = nextConfig;
