-- Add IMAP fields to bcl_emails_accounts table
ALTER TABLE bcl_emails_accounts
ADD COLUMN imap_host TEXT,
ADD COLUMN imap_port INTEGER;
