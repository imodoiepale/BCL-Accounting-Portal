    -- First, let's check if we need to drop existing objects
    DO $$ 
    BEGIN
        -- Drop tables if they exist
        DROP TABLE IF EXISTS bcl_emails_drafts CASCADE;
        DROP TABLE IF EXISTS bcl_emails_messages CASCADE;
        DROP TABLE IF EXISTS bcl_emails_accounts CASCADE;
        
        -- Drop the enum type if it exists
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'email_provider') THEN
            DROP TYPE email_provider CASCADE;
        END IF;
    END $$;

    -- Create the email provider enum type
    CREATE TYPE email_provider AS ENUM ('gmail', 'outlook', 'yahoo', 'other');

    -- Create the email accounts table with the enum type
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

    -- Test the enum type
    INSERT INTO bcl_emails_accounts (email, provider, app_password)
    VALUES ('test@example.com', 'gmail', 'test_password');

    -- Verify the insertion
    SELECT * FROM bcl_emails_accounts;

    -- Clean up test data
    DELETE FROM bcl_emails_accounts WHERE email = 'test@example.com';
    INSERT INTO bcl_emails_accounts (email, provider, app_password)
    VALUES ('test@example.com', 'gmail', 'test_password');

    