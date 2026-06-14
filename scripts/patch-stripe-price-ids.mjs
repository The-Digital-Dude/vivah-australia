import { readFileSync } from 'fs';
import { MongoClient } from 'mongodb';

const envVars = Object.fromEntries(
  readFileSync(new URL('../apps/api/.env', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);

const PRICE_MAP = {
  PREMIUM_MONTHLY:   'price_1TiLcfK7oraieJzZ9fqKyzrH',
  PREMIUM_QUARTERLY: 'price_1TiLcgK7oraieJzZeZO1B8v6',
  GOLD_MONTHLY:      'price_1TiLcgK7oraieJzZc7QoxlwH',
  PLATINUM_MONTHLY:  'price_1TiLchK7oraieJzZtsV8480Q',
};

const client = new MongoClient(envVars['MONGODB_URI']);
await client.connect();
const plans = client.db().collection('plans');

for (const [code, priceId] of Object.entries(PRICE_MAP)) {
  const update = { stripePriceId: priceId };
  const r = await plans.updateOne({ code }, { $set: update });
  const status = r.matchedCount === 0 ? 'NOT FOUND' : r.modifiedCount ? 'UPDATED' : 'already set';
  console.log(`${code}: ${status} => ${priceId}`);
}

await client.close();
console.log('Done.');
