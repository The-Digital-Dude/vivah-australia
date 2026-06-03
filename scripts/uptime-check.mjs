const DEFAULT_TIMEOUT_MS = 15000;

function parseTargets() {
  const entries = [
    ['api', process.env.UPTIME_API_URL],
    ['web', process.env.UPTIME_WEB_URL],
  ];

  return entries
    .map(([label, value]) => ({
      label,
      url: typeof value === 'string' ? value.trim() : '',
    }))
    .filter((entry) => entry.url.length > 0);
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      headers: { 'user-agent': 'vivah-uptime-check/1.0' },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

const timeoutMs = Number(process.env.UPTIME_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
const targets = parseTargets();

if (targets.length === 0) {
  console.error('No uptime targets configured. Set UPTIME_API_URL and/or UPTIME_WEB_URL.');
  process.exit(1);
}

let failed = false;

for (const target of targets) {
  const startedAt = Date.now();

  try {
    const response = await fetchWithTimeout(target.url, timeoutMs);
    const durationMs = Date.now() - startedAt;
    const ok = response.ok;

    console.log(
      JSON.stringify({
        target: target.label,
        url: target.url,
        ok,
        status: response.status,
        durationMs,
        checkedAt: new Date().toISOString(),
      }),
    );

    if (!ok) {
      failed = true;
    }
  } catch (error) {
    failed = true;
    console.error(
      JSON.stringify({
        target: target.label,
        url: target.url,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        checkedAt: new Date().toISOString(),
      }),
    );
  }
}

if (failed) {
  process.exit(1);
}
