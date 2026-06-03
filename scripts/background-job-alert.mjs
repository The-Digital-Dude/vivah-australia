function requiredEnv(name) {
  const value = process.env[name];
  return typeof value === 'string' ? value.trim() : '';
}

const webhookUrl = requiredEnv('BACKGROUND_JOB_ALERT_WEBHOOK_URL');

if (!webhookUrl) {
  console.log('No BACKGROUND_JOB_ALERT_WEBHOOK_URL configured. Skipping background job alert.');
  process.exit(0);
}

const payload = {
  timestamp: new Date().toISOString(),
  service: 'vivah-ops',
  event: 'BACKGROUND_JOB_FAILED',
  jobName: requiredEnv('BACKGROUND_JOB_NAME') || 'unknown-job',
  workflow: requiredEnv('GITHUB_WORKFLOW') || undefined,
  runId: requiredEnv('GITHUB_RUN_ID') || undefined,
  runNumber: requiredEnv('GITHUB_RUN_NUMBER') || undefined,
  repository: requiredEnv('GITHUB_REPOSITORY') || undefined,
  ref: requiredEnv('GITHUB_REF_NAME') || undefined,
  actor: requiredEnv('GITHUB_ACTOR') || undefined,
  runUrl: requiredEnv('BACKGROUND_JOB_RUN_URL') || undefined,
  failureSummary: requiredEnv('BACKGROUND_JOB_FAILURE_SUMMARY') || 'Scheduled job reported a failure.',
};

const response = await fetch(webhookUrl, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(payload),
});

if (!response.ok) {
  console.error(`Background job alert failed with status ${response.status}`);
  process.exit(1);
}

console.log(`Background job alert sent for ${payload.jobName}.`);
