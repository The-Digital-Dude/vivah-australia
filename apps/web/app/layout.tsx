import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from './auth-context';
import CampaignBannerStrip from './components/campaign-banner-strip';

export const metadata: Metadata = {
  title: 'Vivah Australia',
  description: 'Premium matrimonial and matchmaking platform for Australia.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-AU">
      <body>
        <CampaignBannerStrip />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
