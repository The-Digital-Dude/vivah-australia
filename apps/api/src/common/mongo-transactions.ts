import mongoose, { type ClientSession } from 'mongoose';

const unsupportedTransactionMessage =
  'Transaction numbers are only allowed on a replica set member or mongos';

function nestedOriginalError(error: Error): unknown {
  if (!('originalError' in error)) {
    return undefined;
  }

  return (error as { originalError?: unknown }).originalError;
}

function isUnsupportedTransactionError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  if (error.message.includes(unsupportedTransactionMessage)) {
    return true;
  }

  return isUnsupportedTransactionError(nestedOriginalError(error));
}

export async function runInTransaction<T>(work: (session?: ClientSession) => Promise<T>) {
  const session = await mongoose.startSession();
  try {
    let result: T | undefined;
    try {
      await session.withTransaction(async () => {
        result = await work(session);
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'production' || !isUnsupportedTransactionError(error)) {
        throw error;
      }
      result = await work();
    }

    return result as T;
  } finally {
    await session.endSession();
  }
}
