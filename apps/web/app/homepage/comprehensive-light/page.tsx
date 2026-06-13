import { Metadata } from 'next';
import { ComprehensiveLightClient } from '../comprehensive/comprehensive-light-client';

export const metadata: Metadata = {
  title: 'Vivah Australia | Premium Matchmaking for Indians in Australia (Light)',
  description: 'Find your life partner with Vivah Australia. Premium matchmaking, verified profiles, and dedicated support for the Indian community across Sydney, Melbourne, and all of Australia.',
};

export default function ComprehensiveLightPage() {
  return <ComprehensiveLightClient />;
}
