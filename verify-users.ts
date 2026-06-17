import { connectDatabase, disconnectDatabase } from './apps/api/src/db/connection.js';
import { UserModel } from './apps/api/src/models/index.js';
import { env } from './apps/api/src/env.js';

async function verifyAllUsers() {
  console.log('Connecting to database...');
  await connectDatabase(env.MONGODB_URI);
  
  console.log('Updating all users to verified...');
  const result = await UserModel.updateMany(
    { emailVerified: false },
    { $set: { emailVerified: true, status: 'ACTIVE' } },
  );
  
  console.log(`Updated ${result.modifiedCount} users to verified.`);
  
  await disconnectDatabase();
}

verifyAllUsers().catch(console.error);
