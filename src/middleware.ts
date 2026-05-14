import { type NextRequest, NextResponse } from 'next/server'

// Simplified middleware - just pass through all requests
// Auth is handled client-side
export async function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: []
}
