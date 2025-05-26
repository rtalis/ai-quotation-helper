/** @type {import('next').NextConfig} */
const nextConfig = {
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