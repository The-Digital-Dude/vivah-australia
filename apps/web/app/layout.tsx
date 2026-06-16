import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from './auth-context';
import CampaignBannerStrip from './components/campaign-banner-strip';
import SmoothScrollProvider from './smooth-scroll-provider';
import GoogleProvider from './google-provider';

export const metadata: Metadata = {
  title: 'Vivah Australia',
  description: 'Premium matrimonial and matchmaking platform for Australia.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-AU">
      <body>
        <GoogleProvider>
          <CampaignBannerStrip />
          <SmoothScrollProvider />
          <AuthProvider>{children}</AuthProvider>
        </GoogleProvider>
      </body>
    </html>
  );
}
