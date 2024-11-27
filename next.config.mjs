import { config as dotenvConfig } from 'dotenv';

// Load environment variables from .env.local
dotenvConfig();

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    output: 'standalone', // Important for Docker deployment
    reactStrictMode: true,
  },
};

export default nextConfig;
