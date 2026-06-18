import type { Types } from 'mongoose';
import { InterestModel } from '../models/index.js';

export interface ResponsivenessSignal {
  label: 'Responsive' | 'Very Responsive';
  responseRate: number;
  totalReceived: number;
  respondedCount: number;
}

const MINIMUM_RECEIVED_INTERESTS = 3;
const TIMELY_RESPONSE_WINDOW_MS = 72 * 60 * 60 * 1000;

function classifyResponsiveness(input: {
  totalReceived: number;
  respondedCount: number;
  timelyRespondedCount: number;
}): ResponsivenessSignal | undefined {
  const { respondedCount, timelyRespondedCount, totalReceived } = input;

  if (totalReceived < MINIMUM_RECEIVED_INTERESTS) {
    return undefined;
  }

  const responseRate = respondedCount / totalReceived;
  const timelyResponseRate = timelyRespondedCount / totalReceived;

  if (responseRate >= 0.8 && timelyResponseRate >= 0.6) {
    return {
      label: 'Very Responsive',
      responseRate,
      totalReceived,
      respondedCount,
    };
  }

  if (responseRate >= 0.6 && timelyResponseRate >= 0.4) {
    return {
      label: 'Responsive',
      responseRate,
      totalReceived,
      respondedCount,
    };
  }

  return undefined;
}

export async function getResponsivenessSignals(userIds: Types.ObjectId[]) {
  const uniqueUserIds = Array.from(
    new Map(userIds.map((userId) => [userId.toString(), userId])).values(),
  );

  if (!uniqueUserIds.length) {
    return new Map<string, ResponsivenessSignal>();
  }

  const rows = await InterestModel.aggregate<{
    _id: Types.ObjectId;
    totalReceived: number;
    respondedCount: number;
    timelyRespondedCount: number;
  }>([
    {
      $match: {
        receiverId: { $in: uniqueUserIds },
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: '$receiverId',
        totalReceived: { $sum: 1 },
        respondedCount: {
          $sum: {
            $cond: [{ $ifNull: ['$respondedAt', false] }, 1, 0],
          },
        },
        timelyRespondedCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ifNull: ['$respondedAt', false] },
                  {
                    $lte: [{ $subtract: ['$respondedAt', '$createdAt'] }, TIMELY_RESPONSE_WINDOW_MS],
                  },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  const signals = new Map<string, ResponsivenessSignal>();
  for (const row of rows) {
    const signal = classifyResponsiveness(row);
    if (signal) {
      signals.set(row._id.toString(), signal);
    }
  }

  return signals;
}

export async function getResponsivenessSignal(userId: Types.ObjectId) {
  const signals = await getResponsivenessSignals([userId]);
  return signals.get(userId.toString());
}
