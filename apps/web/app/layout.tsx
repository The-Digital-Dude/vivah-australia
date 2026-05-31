import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vivah Australia',
  description: 'Premium matrimonial and matchmaking platform for Australia.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-AU">
      <body>{children}</body>
    </html>
  );
}
