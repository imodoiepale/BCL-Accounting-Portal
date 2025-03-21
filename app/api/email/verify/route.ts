import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Database } from '@/types/supabase';

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

export async function POST(request: Request) {
  try {
    const { provider, accessToken, appPassword, email } = await request.json();

    if (!provider || (!accessToken && !appPassword)) {
      return NextResponse.json(
        { error: 'Provider and either access token or app password are required' },
        { status: 400 }
      );
    }

    // For Gmail OAuth, verify in Edge
    if (provider === 'gmail' && accessToken) {
      try {
        const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          console.error('Gmail API error:', await response.text());
          return NextResponse.json(
            { error: 'Invalid Gmail credentials' },
            { status: 401 }
          );
        }

        const profile = await response.json();
        if (profile.emailAddress !== email) {
          return NextResponse.json(
            { error: 'Email address mismatch' },
            { status: 401 }
          );
        }

        return NextResponse.json({ success: true });
      } catch (error) {
        console.error('Gmail verification error:', error);
        return NextResponse.json(
          { error: 'Failed to verify Gmail credentials' },
          { status: 500 }
        );
      }
    }

    // For other providers or app password, we'll verify during account creation
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
