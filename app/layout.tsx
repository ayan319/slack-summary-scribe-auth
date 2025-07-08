import { Inter } from 'next/font/google';
import './globals.css';
import ConditionalFooter from '@/components/ConditionalFooter';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/components/providers/AuthProvider';
// Import Sentry singleton client to ensure global initialization
import '@/lib/sentry.client';
import { metadata } from './metadata';

const inter = Inter({ subsets: ['latin'] });

export { metadata };

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
