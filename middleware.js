import { NextResponse } from 'next/server';

// Gates /admin pages and /api/admin/* endpoints behind HTTP Basic Auth.
// Credentials come from ADMIN_USER / ADMIN_PASSWORD env vars.
export function middleware(request) {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;

  if (!user || !pass) {
    return new NextResponse('Admin area is not configured (missing ADMIN_USER/ADMIN_PASSWORD).', {
      status: 500,
    });
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Basic ')) {
    const decoded = atob(authHeader.slice(6));
    const sepIndex = decoded.indexOf(':');
    const suppliedUser = decoded.slice(0, sepIndex);
    const suppliedPass = decoded.slice(sepIndex + 1);
    if (suppliedUser === user && suppliedPass === pass) {
      return NextResponse.next();
    }
  }

  return new NextResponse('Authentication required.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Cathedral School PA Admin"' },
  });
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
