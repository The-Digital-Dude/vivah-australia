import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isMemberRoute = pathname.startsWith('/member');
  const isAdminRoute = pathname.startsWith('/admin');
  const isAdminLogin = pathname === '/admin/login';

  if (!isMemberRoute && !isAdminRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get('accessToken')?.value;

  if (isAdminRoute && !isAdminLogin && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    return NextResponse.redirect(url);
  }

  if (isMemberRoute && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Allow access if token exists (actual validation happens on the API side)
  return NextResponse.next();
}

export const config = {
  matcher: ['/member/:path*', '/admin/:path*'],
};
