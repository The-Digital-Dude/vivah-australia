import mongoose from 'mongoose';
import Stripe from 'stripe';
import { env } from '../env.js';
import { PlanModel } from '../models/index.js';

const stripe = new Stripe(env.STRIPE_SECRET_KEY as string, { apiVersion: '2026-05-27.dahlia' });

async function syncStripe() {
  if (!env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY is missing from .env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected.');

  const plans = await PlanModel.find({ isDeleted: false, code: { $ne: 'FREE' } });
  
  console.log(`Found ${plans.length} paid plans to sync to Stripe...`);

  for (const plan of plans) {
    console.log(`\nSyncing plan: ${plan.name} (${plan.code})`);
    
    // Create product
    const product = await stripe.products.create({
      name: plan.name,
      ...(plan.description ? { description: plan.description } : {}),
      metadata: {
        code: plan.code
      }
    });
    console.log(`Created Stripe Product: ${product.id}`);

    // Create price
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.priceCents,
      currency: plan.currency.toLowerCase(),
      recurring: {
        interval: plan.interval === 'YEAR' ? 'year' : 'month'
      },
      metadata: {
        code: plan.code
      }
    });
    console.log(`Created Stripe Price: ${price.id}`);

    // Update DB
    plan.stripePriceId = price.id;
    await plan.save();
    console.log(`Updated database with new stripePriceId: ${price.id}`);
  }

  console.log('\nSuccessfully synced all plans to Stripe Sandbox!');
  process.exit(0);
}

syncStripe().catch(console.error);
