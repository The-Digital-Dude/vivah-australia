import { Queue, Worker } from 'bullmq';
import { MatchRecommendationModel, ProfileModel, SavedSearchModel } from '../models/index.js';
import { calculateMatchScore, searchProfiles } from './match.service.js';
import { AccountStatus, ProfileVisibility } from '@vivah/shared';
import { createNotification } from '../notifications/notifications.service.js';
import { redisClient } from '../common/redis.js';

const redisConnection = redisClient;

export const matchCachingQueue = redisConnection
  ? new Queue('matchCachingQueue', { connection: redisConnection as any })
  : null;

export const matchCachingWorker = redisConnection
  ? new Worker('matchCachingQueue', async (job) => {
  // Base query for active profiles
  const baseQuery = {
    isDeleted: false,
    userIsDeleted: false,
    userStatus: AccountStatus.ACTIVE,
    'visibility.status': { $in: [ProfileVisibility.PUBLIC, ProfileVisibility.MEMBERS_ONLY] },
  };

  const cursor = ProfileModel.find(baseQuery).cursor();

  for await (const viewer of cursor) {
    const scoredMatches = [];
    
    // Determine the base filter for candidates
    const viewerPreference = viewer.partnerPreference ?? {};
    const genderFilter = viewer.personal.gender === 'MALE' ? 'FEMALE' : viewer.personal.gender === 'FEMALE' ? 'MALE' : undefined;

    const candidateQuery: any = { ...baseQuery, _id: { $ne: viewer._id } };
    if (genderFilter) {
      candidateQuery['personal.gender'] = genderFilter;
    }
    
    if (viewerPreference.ageMin !== undefined || viewerPreference.ageMax !== undefined) {
      candidateQuery['personal.age'] = {
        ...(viewerPreference.ageMin !== undefined ? { $gte: viewerPreference.ageMin } : {}),
        ...(viewerPreference.ageMax !== undefined ? { $lte: viewerPreference.ageMax } : {}),
      };
    }

    // Pull candidates to score, max 1000 to prevent memory blowup per viewer
    const candidates = await ProfileModel.find(candidateQuery)
      .sort({ 'stats.lastActiveAt': -1 })
      .limit(1000);

    for (const candidate of candidates) {
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

    if (topMatches.length > 0) {
      const bulkOps = [
        { deleteMany: { filter: { userId: viewer.userId } } },
        ...topMatches.map((match) => ({
          insertOne: { document: match },
        })),
      ];
      await MatchRecommendationModel.bulkWrite(bulkOps);
    } else {
      await MatchRecommendationModel.deleteMany({ userId: viewer.userId });
    }
  }
  }, { connection: redisConnection as any })
  : null;

matchCachingWorker?.on('failed', (job, err) => {
  console.error(`Match caching job ${job?.id} failed:`, err);
});

export const savedSearchNotifyQueue = redisConnection
  ? new Queue('savedSearchNotifyQueue', { connection: redisConnection as any })
  : null;

export const savedSearchNotifyWorker = redisConnection
  ? new Worker('savedSearchNotifyQueue', async (job) => {
      const searches = await SavedSearchModel.find({ isDeleted: false, notifyOnNewMatches: true });
      for (const search of searches) {
        // Run search using current query and take top 5
        const result = await searchProfiles(search.userId, { ...((search.query as any) || {}), page: 1, limit: 5 });
        if (result.results.length > 0) {
          // Check if there are profiles created recently (in last 24h)
          const now = new Date();
          const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          const newMatches = result.results.filter((m) => {
            const createdAt = (m as any).createdAt;
            return createdAt && new Date(createdAt) > oneDayAgo;
          });
          
          if (newMatches.length > 0) {
            await createNotification({
              userId: search.userId,
              type: 'NEW_MATCHES',
              title: `New matches for your search "${search.name}"`,
              body: `We found ${newMatches.length} new profiles matching your search criteria.`,
              emailSubject: `New Matches: ${search.name}`,
              emailBody: `We found ${newMatches.length} new profiles matching your search "${search.name}". Check them out on Vivah Australia!`,
              pushBody: `We found ${newMatches.length} new profiles matching your search "${search.name}".`
            });
          }
        }
      }
    }, { connection: redisConnection as any })
  : null;

savedSearchNotifyWorker?.on('failed', (job, err) => {
  console.error(`Saved search notify job ${job?.id} failed:`, err);
});
