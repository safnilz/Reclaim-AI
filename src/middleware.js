import { NextResponse } from 'next/server';

export function middleware(req) {
  // Read the Authorization header
  const basicAuth = req.headers.get('authorization');

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, pwd] = atob(authValue).split(':');

    // Strong credentials for Management View
    if (user === 'ehfaaz_mgmt' && pwd === 'EhfaazDirector2026!$') {
      return NextResponse.next();
    }
  }
  
  // If not authenticated, request Basic Auth
  return new NextResponse('Authentication required to view Live CRM Data', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Ehfaaz Management Secure Area"',
    },
  });
}

// Ensure middleware only runs on actual pages and api routes, ignoring static files
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
