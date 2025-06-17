import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  
  // Define public paths that don't require authentication
  const publicPaths = ['/login', '/api/auth']
  
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )
  
  // Allow public paths and authenticated requests
  if (isPublicPath || token) {
    return NextResponse.next()
  }
  
  // Redirect to login if not authenticated and trying to access protected route
  return NextResponse.redirect(new URL('/login', request.url))
}

export const config = {
  matcher: [
    // Protect all routes except public ones
    '/((?!_next/static|_next/image|favicon.ico|login|api/auth).*)',
  ],
}