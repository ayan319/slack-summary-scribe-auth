import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'),
  title: 'Slack Summary Scribe - AI-Powered Conversation Summaries',
  description: 'Transform your Slack conversations into actionable insights with AI-powered summaries. Connect your workspace and get intelligent summaries of your team communications.',
  keywords: 'slack, ai, summaries, team communication, productivity, artificial intelligence',
  authors: [{ name: 'Slack Summary Scribe' }],
  openGraph: {
    title: 'Slack Summary Scribe - AI-Powered Conversation Summaries',
    description: 'Transform your Slack conversations into actionable insights with AI-powered summaries.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
    siteName: 'Slack Summary Scribe',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Slack Summary Scribe - AI-Powered Conversation Summaries',
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
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};
