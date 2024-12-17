// @ts-nocheck
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table');
  const field = searchParams.get('field');
  const mainTab = searchParams.get('mainTab');

  if (!table) {
    return NextResponse.json(
      { error: 'Table parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Fetch dropdown options dynamically based on the table and field
    const { data, error } = await supabase
      .from(table)
      .select(field)
      .order(field);

    if (error) {
      console.error('Error fetching dropdown options:', error);
      return NextResponse.json(
        { error: 'Failed to fetch dropdown options' },
        { status: 500 }
      );
    }

    // Extract unique values, removing duplicates and empty values
    const options = [...new Set(
      data
        .map(item => item[field])
        .filter(value => value !== null && value !== undefined && value !== '')
    )];

    // Log the fetched options for debugging
    console.log(`Dropdown options for ${table}.${field}:`, options);

    return NextResponse.json(options);
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
