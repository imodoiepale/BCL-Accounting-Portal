-- Drop existing tables and type
DROP TABLE IF EXISTS bcl_emails_drafts;
DROP TABLE IF EXISTS bcl_emails_messages;
DROP TABLE IF EXISTS bcl_emails_accounts;
DROP TYPE IF EXISTS email_provider;

-- Create the enum type
CREATE TYPE email_provider AS ENUM ('gmail', 'outlook', 'yahoo', 'other');

-- Create helper function to check column type
CREATE OR REPLACE FUNCTION get_column_type(table_name text, column_name text)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN (
        SELECT data_type || CASE 
            WHEN udt_name = 'email_provider' THEN ' (enum)'
            ELSE ''
        END
        FROM information_schema.columns
        WHERE table_name = $1
        AND column_name = $2
    );
END;
$$;

-- Recreate the email accounts table
CREATE TABLE bcl_emails_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    provider email_provider NOT NULL,
    app_password TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expiry TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE bcl_emails_accounts ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all operations on email accounts"
    ON bcl_emails_accounts FOR ALL
    USING (true)
    WITH CHECK (true);
