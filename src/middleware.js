import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Allow access to login page and authentication API without cookie
  if (pathname === '/login' || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Check for our custom auth cookie
  const authCookie = request.cookies.get('ehfaaz_mgmt_session');

  if (authCookie && authCookie.value === 'authenticated') {
    return NextResponse.next();
  }
  
  // If not authenticated, redirect to the custom login page
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  return NextResponse.redirect(url);
}

// Ensure proxy only runs on actual pages and api routes, ignoring static files
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.png (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.png).*)',
  ],
};
