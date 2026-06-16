import { Suspense } from 'react';
import PricingClient from './pricing-client';

export const metadata = {
  title: 'Membership Pricing | Vivah Australia',
  description: 'Compare Vivah Australia membership plans and choose the right level of access.',
};

export default function PricingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PricingClient />
    </Suspense>
  );
}
