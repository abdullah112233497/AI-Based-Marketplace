import { NextResponse, type NextRequest } from 'next/server';

/**
 * Lightweight client navigation protection middleware.
 * Note: Authoritative authorization is always enforced server-side by FastAPI backend.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;

  // Protect /admin routes from unauthenticated direct navigation
  if (pathname.startsWith('/admin')) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect /agent routes from unauthenticated direct navigation
  if (pathname.startsWith('/agent')) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/agent/:path*'],
};
