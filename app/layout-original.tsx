import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
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
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
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
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        {process.env.NODE_ENV === 'production' && (
          <script
            defer
            data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.js"
          />
        )}
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
