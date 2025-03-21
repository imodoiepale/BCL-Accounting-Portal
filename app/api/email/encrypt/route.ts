import { encrypt } from '@/lib/encryption';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'Text to encrypt is required' },
        { status: 400 }
      );
    }

    const encrypted = encrypt(text);
    return NextResponse.json({ encrypted });
  } catch (error) {
    console.error('Encryption error:', error);
    return NextResponse.json(
      { error: 'Failed to encrypt data' },
      { status: 500 }
    );
  }
}
