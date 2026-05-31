import { createApp } from './app.js';
import { connectDatabase } from './db/connection.js';
import { env } from './env.js';

const corsOrigins = env.CORS_ORIGINS.split(',').map((origin) => origin.trim());
const app = createApp({
  corsOrigins,
  auth: {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    exposeSensitiveTokens: env.NODE_ENV !== 'production',
  },
});

await connectDatabase(env.MONGODB_URI);

app.listen(env.API_PORT, () => {
  console.log(`API listening on ${env.API_BASE_URL}`);
});
