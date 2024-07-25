import { config as dotenvConfig } from 'dotenv';

// Load environment variables from .env.local
dotenvConfig();

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  },
};

export default nextConfig;
