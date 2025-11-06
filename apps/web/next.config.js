/** @type {import('next').NextConfig} */

// -----------------------------------------------------------------------------
// Speechwriter – Root Redirect Configuration
// -----------------------------------------------------------------------------
// This ensures that anyone visiting "/" is automatically sent to "/login".
// You can later change "/login" to "/dashboard" if you prefer.
// -----------------------------------------------------------------------------

const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
