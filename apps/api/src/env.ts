import { config } from 'dotenv';
import { apiEnvSchema, parseEnv, type ApiEnv } from '@vivah/shared';

config();

export const env: ApiEnv = parseEnv(apiEnvSchema, process.env);
