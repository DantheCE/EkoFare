import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Danfo } from 'next/font/google';
import '../styles/index.css';

import Layout from './components/Layout';
import QueryProvider from './components/QueryProvider';

// Plus Jakarta Sans — body + all numbers. Self-hosted by next/font (no FOUT,
// fallback metrics prevent layout shift). Exposed as --font-jakarta, which
// theme.css reads via --font-body.
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

// Danfo — display face for the wordmark + headers only (Spec §1.3). Self-hosted
// by next/font; theme.css reads it via --font-danfo → --font-display.
const danfo = Danfo({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-danfo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'EkoFare — Lagos Transit Fares',
  description: 'Check Danfo, BRT, and Keke fares across Lagos before you board.',
};

export const viewport: Viewport = {
  themeColor: '#131109',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${danfo.variable} h-full antialiased`}>
      <body className="min-h-full">
        <QueryProvider>
          <Layout>{children}</Layout>
        </QueryProvider>
      </body>
    </html>
  );
}
