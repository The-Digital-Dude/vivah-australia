import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { env } from '../env.js';
import { MatchRecommendationModel, ProfileModel } from '../models/index.js';
import { calculateMatchScore } from './match.service.js';
import { AccountStatus, ProfileVisibility } from '@vivah/shared';

const redisConnection = new Redis(env.REDIS_URI, {
  maxRetriesPerRequest: null,
});

export const matchCachingQueue = new Queue('matchCachingQueue', { connection: redisConnection as any });

export const matchCachingWorker = new Worker('matchCachingQueue', async (job) => {
  // Get all active users
  const activeProfiles = await ProfileModel.find({
    isDeleted: false,
    userIsDeleted: false,
    userStatus: AccountStatus.ACTIVE,
    'visibility.status': { $in: [ProfileVisibility.PUBLIC, ProfileVisibility.MEMBERS_ONLY] },
  });

  const batchSize = 100;

  for (const viewer of activeProfiles) {
    const scoredMatches = [];
    
    // Determine the base filter for candidates
    const viewerPreference = viewer.partnerPreference ?? {};
    const genderFilter = viewer.personal.gender === 'MALE' ? 'FEMALE' : viewer.personal.gender === 'FEMALE' ? 'MALE' : undefined;

    for (const candidate of activeProfiles) {
      if (String(viewer._id) === String(candidate._id)) continue;
      if (genderFilter && candidate.personal.gender !== genderFilter) continue;
      
      const { score, reasons } = calculateMatchScore(viewer, candidate);
      
      if (score > 0) {
        scoredMatches.push({
          userId: viewer.userId,
          recommendedProfileId: candidate._id,
          score,
          reasons,
        });
      }
    }

    // Sort and keep top ones
    scoredMatches.sort((a, b) => b.score - a.score);
    const topMatches = scoredMatches.slice(0, 50); // Store top 50 recommendations

    // Replace the old recommendations with the new ones for this user
    await MatchRecommendationModel.deleteMany({ userId: viewer.userId });
    if (topMatches.length > 0) {
      await MatchRecommendationModel.insertMany(topMatches);
    }
  }
}, { connection: redisConnection as any });

matchCachingWorker.on('failed', (job, err) => {
  console.error(`Match caching job ${job?.id} failed:`, err);
});
