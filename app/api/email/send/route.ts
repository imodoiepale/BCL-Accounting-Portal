import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Database } from '@/types/supabase';
import { decrypt } from '@/lib/encryption';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';

// Initialize Supabase with service role for server-side operations
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
    },
  }
);

export const runtime = 'edge';

async function getGmailTransporter(account: any) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.NEXT_PUBLIC_GMAIL_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: account.refresh_token,
  });

  const accessToken = await oauth2Client.getAccessToken();

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: account.email,
      clientId: process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: account.refresh_token,
      accessToken: accessToken.token!,
    },
  });
}

async function getStandardTransporter(account: any) {
  const decryptedPassword = decrypt(account.app_password);
  
  let config: any = {
    auth: {
      user: account.email,
      pass: decryptedPassword,
    },
  };

  switch (account.provider) {
    case 'outlook':
      config = {
        ...config,
        host: 'smtp.office365.com',
        port: 587,
        secure: false,
      };
      break;
    case 'yahoo':
      config = {
        ...config,
        host: 'smtp.mail.yahoo.com',
        port: 465,
        secure: true,
      };
      break;
    default:
      throw new Error('Unsupported email provider');
  }

  return nodemailer.createTransport(config);
}

export async function POST(request: Request) {
  try {
    const { accountId, to, subject, text, html, attachments, inReplyTo, references } = await request.json();

    if (!accountId || !to?.length || !subject) {
      return NextResponse.json(
        { error: 'Account ID, recipients, and subject are required' },
        { status: 400 }
      );
    }

    // Get account details
    const { data: account } = await supabase
      .from('bcl_emails_accounts')
      .select()
      .eq('id', accountId)
      .single();

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Create appropriate transporter based on provider
    const transporter = account.provider === 'gmail'
      ? await getGmailTransporter(account)
      : await getStandardTransporter(account);

    // Send email
    await transporter.sendMail({
      from: account.email,
      to: to.join(', '),
      subject,
      text,
      html,
      attachments,
      inReplyTo,
      references,
    });

    // Store sent message in database
    const { data: message, error: dbError } = await supabase
      .from('bcl_emails_messages')
      .insert({
        account_id: accountId,
        message_id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        subject,
        from: account.email,
        to,
        date: new Date().toISOString(),
        body_text: text,
        body_html: html,
        attachments,
        labels: ['sent'],
        is_read: true,
        is_archived: false,
        is_starred: false,
        thread_id: inReplyTo || undefined,
        in_reply_to: inReplyTo,
        references: references || [],
      })
      .select()
      .single();

    if (dbError) {
      throw dbError;
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Failed to send email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
