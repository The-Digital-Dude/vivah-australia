import { NextResponse, type NextRequest } from 'next/server';

const adminRoles = new Set(['SUPER_ADMIN', 'ADMIN', 'MODERATOR']);

interface AccessTokenPayload {
  exp?: number;
  role?: string;
  sub?: string;
  type?: string;
}

function decodeAccessToken(token: string): AccessTokenPayload | null {
  const [, payload = ''] = token.split('.');
  if (!payload) {
    return null;
  }

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const decoded = atob(padded);
    return JSON.parse(decoded) as AccessTokenPayload;
  } catch {
    return null;
  }
}

function buildLoginRedirect(request: NextRequest) {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.search = '';
  loginUrl.searchParams.set('redirect', `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

function buildHomeRedirect(request: NextRequest, message: string) {
  const homeUrl = request.nextUrl.clone();
  homeUrl.pathname = '/';
  homeUrl.search = '';
  homeUrl.searchParams.set('message', message);
  return NextResponse.redirect(homeUrl);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('accessToken')?.value;
  if (!accessToken) {
    return buildLoginRedirect(request);
  }

  const payload = decodeAccessToken(accessToken);
  if (!payload || payload.type !== 'access' || typeof payload.sub !== 'string') {
    return buildLoginRedirect(request);
  }

  if (typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now()) {
    return buildLoginRedirect(request);
  }

  if (pathname.startsWith('/admin')) {
    if (!payload.role || !adminRoles.has(payload.role)) {
      return buildHomeRedirect(request, 'admin-access-required');
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/member/:path*', '/admin/:path*'],
};
