
import { NextResponse } from 'next/server'

export function middleware(request) {
  // This ensures the route is handled separately
  return NextResponse.next()
}

export const config = {
  matcher: ['/mail/policy-terms/:path*'],
}