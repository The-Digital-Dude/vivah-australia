import mongoose from 'mongoose';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runInTransaction } from './mongo-transactions.js';

vi.mock('mongoose', () => ({
  default: {
    startSession: vi.fn(),
  },
}));

interface MockSession {
  withTransaction: ReturnType<typeof vi.fn>;
  endSession: ReturnType<typeof vi.fn>;
}

const originalNodeEnv = process.env.NODE_ENV;
const standaloneTransactionError = new Error(
  'Transaction numbers are only allowed on a replica set member or mongos',
);
const wrappedStandaloneTransactionError = Object.assign(
  new Error('This MongoDB deployment does not support retryable writes. Please add retryWrites=false to your connection string.'),
  { originalError: standaloneTransactionError },
);

function mockSession(error: Error): MockSession {
  return {
    withTransaction: vi.fn(() => Promise.reject(error)),
    endSession: vi.fn(() => Promise.resolve()),
  };
}

describe('runInTransaction', () => {
  beforeEach(() => {
    vi.mocked(mongoose.startSession).mockReset();
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('retries without a session for standalone MongoDB transaction support errors outside production', async () => {
    const session = mockSession(standaloneTransactionError);
    vi.mocked(mongoose.startSession).mockResolvedValue(session as never);
    const work = vi.fn((clientSession?: unknown) =>
      Promise.resolve(clientSession ? 'with-session' : 'without-session'),
    );

    await expect(runInTransaction(work)).resolves.toBe('without-session');

    expect(work).toHaveBeenCalledTimes(1);
    expect(work).toHaveBeenCalledWith();
    expect(session.endSession).toHaveBeenCalledOnce();
  });

  it('throws standalone MongoDB transaction support errors in production', async () => {
    process.env.NODE_ENV = 'production';
    const session = mockSession(standaloneTransactionError);
    vi.mocked(mongoose.startSession).mockResolvedValue(session as never);
    const work = vi.fn(() => Promise.resolve('not-used'));

    await expect(runInTransaction(work)).rejects.toThrow(standaloneTransactionError.message);

    expect(work).not.toHaveBeenCalled();
    expect(session.endSession).toHaveBeenCalledOnce();
  });

  it('retries wrapped standalone MongoDB transaction support errors outside production', async () => {
    const session = mockSession(wrappedStandaloneTransactionError);
    vi.mocked(mongoose.startSession).mockResolvedValue(session as never);
    const work = vi.fn((clientSession?: unknown) =>
      Promise.resolve(clientSession ? 'with-session' : 'without-session'),
    );

    await expect(runInTransaction(work)).resolves.toBe('without-session');

    expect(work).toHaveBeenCalledOnce();
    expect(work).toHaveBeenCalledWith();
    expect(session.endSession).toHaveBeenCalledOnce();
  });

  it('does not retry unrelated transaction errors without a session', async () => {
    const session = mockSession(new Error('transaction aborted because of a write conflict'));
    vi.mocked(mongoose.startSession).mockResolvedValue(session as never);
    const work = vi.fn(() => Promise.resolve('not-used'));

    await expect(runInTransaction(work)).rejects.toThrow('transaction aborted because of a write conflict');

    expect(work).not.toHaveBeenCalled();
    expect(session.endSession).toHaveBeenCalledOnce();
  });
});
