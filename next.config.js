/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['zyszsqgdlrpnunkegipk.supabase.co'],
  },
  env: {
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
    EMAIL_FROM_ADDRESS: process.env.EMAIL_FROM_ADDRESS,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle Node.js-specific modules on the client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'core-js': false,
        timers: false,
        net: false,
        tls: false,
        dns: false,
        'imap-client': false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;