import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from './connection.js';
import { ConversationModel } from '../models/index.js';
import { pairKeyForUsers } from '../common/pair-key.js';

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is required');
  }

  await connectDatabase(uri);
  try {
    const conversations = await ConversationModel.find({ isDeleted: false });
    const duplicates = new Map<string, string[]>();

    for (const conversation of conversations) {
      if (conversation.participantIds.length !== 2) {
        throw new Error(`Conversation ${conversation.id} is not a 1:1 thread`);
      }
      const [firstParticipantId, secondParticipantId] = conversation.participantIds;
      if (!firstParticipantId || !secondParticipantId) {
        throw new Error(`Conversation ${conversation.id} has invalid participants`);
      }
      const pairKey = pairKeyForUsers(firstParticipantId, secondParticipantId);
      const ids = duplicates.get(pairKey) ?? [];
      ids.push(conversation.id);
      duplicates.set(pairKey, ids);
    }

    const conflicts = [...duplicates.entries()].filter(([, ids]) => ids.length > 1);
    if (conflicts.length > 0) {
      const details = conflicts.map(([pairKey, ids]) => ({ pairKey, ids }));
      throw new Error(`Duplicate conversation pairs found: ${JSON.stringify(details, null, 2)}`);
    }

    for (const conversation of conversations) {
      const participantIds = [...conversation.participantIds].sort((a, b) =>
        String(a).localeCompare(String(b)),
      );
      const [firstParticipantId, secondParticipantId] = participantIds;
      if (!firstParticipantId || !secondParticipantId) {
        throw new Error(`Conversation ${conversation.id} has invalid participants`);
      }
      conversation.participantIds = participantIds;
      conversation.pairKey = pairKeyForUsers(firstParticipantId, secondParticipantId);
      await conversation.save();
    }
  } finally {
    await disconnectDatabase();
  }
}

run()
  .then(() => {
    process.stdout.write('Conversation pair key migration complete.\n');
  })
  .catch(async (error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    if (mongoose.connection.readyState !== 0) {
      await disconnectDatabase();
    }
    process.exitCode = 1;
  });
