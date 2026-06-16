import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isMemberRoute = pathname.startsWith('/member');
  const isAdminRoute = pathname.startsWith('/admin');
  const isAdminLogin = pathname === '/admin/login';

  if (!isMemberRoute && !isAdminRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get('accessToken')?.value;

  if (isAdminRoute && !isAdminLogin) {
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }

    try {
      const payloadBase64 = token.split('.')[1];
      if (!payloadBase64) throw new Error('Invalid token');
      const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(payloadJson);

      const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'];
      if (!adminRoles.includes(payload.role)) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
      }
    } catch (e) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
  }

  if (isMemberRoute && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/member/:path*', '/admin/:path*'],
};
