import { connectDatabase, disconnectDatabase } from './connection.js';
import { UserModel } from '../models/user.model.js';
import { ProfileModel } from '../models/profile.model.js';
import dotenv from 'dotenv';
dotenv.config();

async function migrate() {
  await connectDatabase(process.env.MONGODB_URI!);
  console.log('Migrating userStatus and userIsDeleted into Profile schema...');

  const users = await UserModel.find({}).lean();
  console.log(`Found ${users.length} users.`);

  let updated = 0;
  for (const user of users) {
    const result = await ProfileModel.updateOne(
      { userId: user._id },
      { $set: { userStatus: user.status, userIsDeleted: user.isDeleted } }
    );
    if (result.modifiedCount > 0) {
      updated++;
    }
  }

  console.log(`Successfully migrated ${updated} profiles.`);
  await disconnectDatabase();
  process.exit(0);
}

void migrate();
