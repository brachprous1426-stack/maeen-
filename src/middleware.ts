import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Public paths accessible without authentication
  if (
    path === '/' ||
    path === '/login' ||
    path.startsWith('/api/auth/login') ||
    path.startsWith('/_next') ||
    path.startsWith('/assets') ||
    path === '/favicon.ico' ||
    path === '/bader-logo.svg'
  ) {
    return NextResponse.next();
  }

  // Protected paths check
  if (!req.cookies.get('session')) {
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    const loginUrl = new URL('/login', req.url);
    if (path !== '/' && path !== '/login') {
      loginUrl.searchParams.set('redirect', path);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
export const config = { matcher: ['/((?!.*\\.).*)'] };
