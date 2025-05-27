/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev'],

  reactStrictMode: true,
  env: {
    BASE_URL: process.env.BASE_URL,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig