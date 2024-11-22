import { NextResponse } from 'next/server'

export async function GET() {
  // Mock data - in a real application, this would come from a database
  const prepopulatedData = {
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    age: 30,
  }

  return NextResponse.json(prepopulatedData)
}

