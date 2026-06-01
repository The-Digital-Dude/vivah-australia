/* global console, fetch, process, URL */

const webBaseUrl = process.env.WEB_BASE_URL ?? 'http://localhost:3000';
const apiBaseUrl = process.env.API_BASE_URL ?? 'http://localhost:4000';

const frontendRoutes = [
  '/',
  '/contact',
  '/pricing',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/admin/login',
  '/admin/dashboard',
  '/admin/users',
  '/admin/profiles',
  '/admin/verifications',
  '/admin/media',
  '/admin/reports',
  '/admin/payments',
  '/admin/audit-logs',
  '/admin/community',
  '/admin/cms',
  '/member/onboarding',
  '/member/profile/edit',
  '/member/settings',
  '/member/matches',
  '/member/interests',
  '/member/favourites',
  '/member/safety',
  '/member/messages',
  '/member/media',
  '/member/subscription',
  '/member/verification',
  '/member/notifications',
  '/member/community',
  '/pages/privacy-policy',
];

const apiRoutes = [
  '/health',
  '/api/health',
  '/api/public/home',
  '/api/public/featured-profiles',
  '/api/public/plans',
  '/api/public/success-stories',
  '/api/public/testimonials',
  '/api/public/blogs?limit=3',
  '/api/community/rooms',
];

const runtimeErrorMarkers = [
  'Runtime Error',
  'Application error',
  'Internal Server Error',
  'NEXT_REDIRECT',
  '__NEXT_ERROR__',
];

function absoluteUrl(baseUrl, path) {
  return new URL(path, baseUrl).toString();
}

async function fetchText(url) {
  const response = await fetch(url);
  const text = await response.text();
  return { response, text };
}

async function checkFrontendRoute(path) {
  const url = absoluteUrl(webBaseUrl, path);
  const { response, text } = await fetchText(url);
  const markers = runtimeErrorMarkers.filter((marker) => text.includes(marker));
  return {
    kind: 'web',
    path,
    status: response.status,
    bytes: text.length,
    ok: response.ok && text.length >= 500 && markers.length === 0,
    detail: markers.length > 0 ? `markers: ${markers.join(', ')}` : '',
  };
}

async function checkApiRoute(path) {
  const url = absoluteUrl(apiBaseUrl, path);
  const { response, text } = await fetchText(url);
  return {
    kind: 'api',
    path,
    status: response.status,
    bytes: text.length,
    ok: response.ok,
    detail: '',
  };
}

async function discoverDynamicFrontendRoutes() {
  const routes = [];

  try {
    const response = await fetch(absoluteUrl(apiBaseUrl, '/api/public/featured-profiles'));
    if (response.ok) {
      const data = await response.json();
      const profile = Array.isArray(data.profiles)
        ? data.profiles.find((item) => typeof item?._id === 'string' && item._id.length > 0)
        : undefined;

      if (profile?._id) {
        const profileResponse = await fetch(
          absoluteUrl(apiBaseUrl, `/api/profiles/${profile._id}`),
        );
        if (profileResponse.ok) {
          routes.push(`/profiles/${profile._id}`);
        }
      }
    }
  } catch {
    // Dynamic checks are optional because local seed data may not be available.
  }

  return routes;
}

function printResult(result) {
  const label = result.ok ? 'PASS' : 'FAIL';
  const suffix = result.detail ? ` ${result.detail}` : '';
  console.log(
    `${label} ${result.kind.padEnd(3)} ${String(result.status).padEnd(3)} ${String(
      result.bytes,
    ).padStart(6)} ${result.path}${suffix}`,
  );
}

async function run() {
  console.log(`Route QA web=${webBaseUrl} api=${apiBaseUrl}`);

  const dynamicFrontendRoutes = await discoverDynamicFrontendRoutes();
  if (dynamicFrontendRoutes.length === 0) {
    console.log('SKIP web dynamic /profiles/:id - no public profile route candidate available');
  }

  const results = [];
  for (const path of [...frontendRoutes, ...dynamicFrontendRoutes]) {
    try {
      results.push(await checkFrontendRoute(path));
    } catch (error) {
      results.push({
        kind: 'web',
        path,
        status: 'ERR',
        bytes: 0,
        ok: false,
        detail: error instanceof Error ? error.message : 'unknown error',
      });
    }
  }

  for (const path of apiRoutes) {
    try {
      results.push(await checkApiRoute(path));
    } catch (error) {
      results.push({
        kind: 'api',
        path,
        status: 'ERR',
        bytes: 0,
        ok: false,
        detail: error instanceof Error ? error.message : 'unknown error',
      });
    }
  }

  for (const result of results) {
    printResult(result);
  }

  const failed = results.filter((result) => !result.ok);
  if (failed.length > 0) {
    console.error(`Route QA failed: ${failed.length} route(s) failed.`);
    process.exitCode = 1;
    return;
  }

  console.log(`Route QA passed: ${results.length} route(s) checked.`);
}

await run();
