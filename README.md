  This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development  server:


```bash
npm run dev

```
# or
```bash
yarn dev
```
# or
```bash
pnpm dev
```
# or
```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

# BCL Accounting Portal

## Email Integration Setup

The portal supports two methods for email integration:

### 1. OAuth 2.0 (Recommended for Gmail)
- Secure authentication without storing passwords
- Requires setting up OAuth credentials in Google Cloud Console
- Best for Gmail accounts

### 2. IMAP/SMTP with App Passwords
- Alternative method for email access
- Supports Gmail, Outlook, Yahoo, and other email providers
- Requires generating app-specific passwords
- Passwords are securely encrypted before storage

## Environment Setup

1. Run the setup script:
```bash
npm run setup
```

This will guide you through setting up:
- Gmail OAuth credentials
- Supabase configuration
- Email encryption key

2. Or manually create a `.env` file based on `.env.example`:
```env
# Gmail API Configuration
NEXT_PUBLIC_GMAIL_CLIENT_ID=your_client_id_here
NEXT_PUBLIC_GMAIL_CLIENT_SECRET=your_client_secret_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Email Encryption Key (32 bytes, base64 encoded)
# Generate using: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
EMAIL_ENCRYPTION_KEY=your_base64_encoded_32_byte_key
```

### Generating App Passwords

#### For Gmail:
1. Go to your Google Account settings
2. Navigate to Security > 2-Step Verification
3. Scroll to "App passwords"
4. Select "Mail" and your device
5. Copy the generated 16-character password

#### For Outlook:
1. Go to account.microsoft.com/security
2. Select "Advanced security options"
3. Under "App passwords", create a new app password

#### For Yahoo:
1. Go to account.yahoo.com/security
2. Enable 2-step verification if not already enabled
3. Generate an app password for mail

## Security Notes

1. App passwords are encrypted using AES-256-GCM before storage
2. Different encryption keys should be used for development and production
3. Never commit `.env` file or encryption keys to version control
4. Regularly rotate app passwords for security
5. Monitor account access and revoke app passwords if needed

## Development

```bash
# Install dependencies
npm install

# Set up environment variables
npm run setup

# Start development server
npm run dev
```

## Database Schema

The email integration uses the following tables:

- `bcl_emails_accounts`: Stores email account configurations
- `bcl_emails_messages`: Stores email messages
- `bcl_emails_attachments`: Manages email attachments
- `bcl_emails_labels`: Handles custom labels/folders
- `bcl_emails_message_labels`: Junction table for message-label relationships

## Features

- Multiple email account support
- OAuth and IMAP/SMTP authentication
- Secure password storage
- Email search and filtering
- Custom labels and organization
- Attachment handling
- Reply and forward functionality
- Color-coded accounts for better visibility
- OAuth 2.0 for Gmail
- IMAP/SMTP with app passwords for other providers
