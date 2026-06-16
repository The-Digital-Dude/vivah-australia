import mongoose, { type ClientSession } from 'mongoose';

function isUnsupportedTransactionError(error: unknown) {
  return (
    error instanceof Error &&
    (error.message.includes('Transaction numbers are only allowed on a replica set member or mongos') ||
      error.message.toLowerCase().includes('transaction'))
  );
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
