/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@speechwriter/auth', '@speechwriter/config'],
};

module.exports = nextConfig;

