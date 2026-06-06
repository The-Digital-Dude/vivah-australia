import pino from 'pino';

const isTest = process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST);
const isDev = process.env.NODE_ENV === 'development' || (!process.env.NODE_ENV && !isTest);

export const logger = pino({
  level: isTest ? 'silent' : isDev ? 'debug' : 'info',
  ...(isDev && !isTest
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }
    : {}),
});
