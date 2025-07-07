import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ConditionalFooter from '@/components/ConditionalFooter';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/components/providers/AuthProvider';
// Import Sentry singleton client to ensure global initialization
import '@/lib/sentry.client';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'),
  title: 'Slack Summary Scribe - AI-Powered Conversation Summaries',
  description: 'Transform your Slack conversations into actionable insights with AI-powered summaries. Connect your workspace and get intelligent summaries of your team communications.',
  keywords: 'slack, ai, summaries, team communication, productivity, artificial intelligence',
  authors: [{ name: 'Slack Summary Scribe' }],
  openGraph: {
    title: 'Slack Summary Scribe - AI-Powered Conversation Summaries',
    description: 'Transform your Slack conversations into actionable insights with AI-powered summaries.',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'Slack Summary Scribe',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Slack Summary Scribe',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Slack Summary Scribe - AI-Powered Conversation Summaries',
    description: 'Transform your Slack conversations into actionable insights with AI-powered summaries.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ErrorBoundary>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
