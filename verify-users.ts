import { connectDatabase, disconnectDatabase } from './apps/api/src/db/connection.js';
import { User } from './apps/api/src/db/models/User.js';
import { env } from './apps/api/src/env.js';

async function verifyAllUsers() {
  console.log('Connecting to database...');
  await connectDatabase(env.MONGODB_URI);
  
  console.log('Updating all users to verified...');
  const result = await User.updateMany(
    { emailVerified: false },
    { $set: { emailVerified: true, status: 'ACTIVE' } }
  );
  
  console.log(`Updated ${result.modifiedCount} users to verified.`);
  
  await disconnectDatabase();
}

verifyAllUsers().catch(console.error);
