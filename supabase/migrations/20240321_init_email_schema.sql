-- Drop existing tables if they exist
DROP TABLE IF EXISTS bcl_emails_drafts;
DROP TABLE IF EXISTS bcl_emails_messages;
DROP TABLE IF EXISTS bcl_emails_accounts;
DROP TYPE IF EXISTS email_provider;

-- Create enum for email providers
CREATE TYPE email_provider AS ENUM ('gmail', 'outlook', 'yahoo', 'other');

-- Create email accounts table
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

-- Create messages table
CREATE TABLE bcl_emails_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID REFERENCES bcl_emails_accounts(id) ON DELETE CASCADE,
    message_id TEXT NOT NULL,
    subject TEXT,
    "from" TEXT NOT NULL,
    "to" TEXT[] NOT NULL,
    cc TEXT[],
    bcc TEXT[],
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    body_text TEXT,
    body_html TEXT,
    attachments JSONB,
    labels TEXT[],
    is_read BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    is_starred BOOLEAN DEFAULT FALSE,
    thread_id TEXT,
    in_reply_to TEXT,
    references TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create drafts table
CREATE TABLE bcl_emails_drafts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID REFERENCES bcl_emails_accounts(id) ON DELETE CASCADE,
    subject TEXT,
    "to" TEXT[],
    cc TEXT[],
    bcc TEXT[],
    body_text TEXT,
    body_html TEXT,
    attachments JSONB,
    in_reply_to TEXT,
    references TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS but allow all operations for now
ALTER TABLE bcl_emails_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bcl_emails_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bcl_emails_drafts ENABLE ROW LEVEL SECURITY;

-- Allow all operations temporarily
CREATE POLICY "Allow all operations on email accounts"
    ON bcl_emails_accounts FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all operations on email messages"
    ON bcl_emails_messages FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all operations on email drafts"
    ON bcl_emails_drafts FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create helper functions
CREATE OR REPLACE FUNCTION get_thread_messages(p_thread_id TEXT, p_account_id UUID)
RETURNS SETOF bcl_emails_messages
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT * FROM bcl_emails_messages
    WHERE thread_id = p_thread_id
    AND account_id = p_account_id
    ORDER BY date DESC;
$$;

CREATE OR REPLACE FUNCTION get_unread_count(p_account_id UUID)
RETURNS BIGINT
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT COUNT(*) FROM bcl_emails_messages
    WHERE account_id = p_account_id
    AND is_read = FALSE
    AND is_archived = FALSE;
$$;

CREATE OR REPLACE FUNCTION search_messages(p_account_id UUID, p_query TEXT, p_label TEXT, p_is_archived BOOLEAN)
RETURNS SETOF bcl_emails_messages
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT * FROM bcl_emails_messages
    WHERE account_id = p_account_id
    AND (
        p_query IS NULL
        OR subject ILIKE '%' || p_query || '%'
        OR body_text ILIKE '%' || p_query || '%'
        OR "from" ILIKE '%' || p_query || '%'
        OR EXISTS (
            SELECT 1 FROM UNNEST("to") AS to_addr
            WHERE to_addr ILIKE '%' || p_query || '%'
        )
    )
    AND (
        p_label IS NULL
        OR p_label = ANY(labels)
    )
    AND is_archived = p_is_archived
    ORDER BY date DESC;
$$;

-- Create indexes
CREATE INDEX idx_messages_account_id ON bcl_emails_messages(account_id);
CREATE INDEX idx_messages_thread_id ON bcl_emails_messages(thread_id);
CREATE INDEX idx_messages_date ON bcl_emails_messages(date);
CREATE INDEX idx_drafts_account_id ON bcl_emails_drafts(account_id);

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_accounts_updated_at
    BEFORE UPDATE ON bcl_emails_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON bcl_emails_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drafts_updated_at
    BEFORE UPDATE ON bcl_emails_drafts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
