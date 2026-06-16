import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from './auth-context';
import CampaignBannerStrip from './components/campaign-banner-strip';
import CookieConsent from './components/cookie-consent';
import SmoothScrollProvider from './smooth-scroll-provider';
import GoogleProvider from './google-provider';

export const metadata: Metadata = {
  title: 'Vivah Australia',
  description: 'Premium matrimonial and matchmaking platform for Australia.',
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-AU">
      <body>
        <GoogleProvider>
          <CampaignBannerStrip />
          <SmoothScrollProvider />
          <AuthProvider>{children}</AuthProvider>
          <CookieConsent />
        </GoogleProvider>
      </body>
    </html>
  );
}
