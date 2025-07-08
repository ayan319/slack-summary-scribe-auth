import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable strict mode for better development experience
  reactStrictMode: true,

  // Image optimization for Slack and Google avatars
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.slack-edge.com',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'secure.gravatar.com',
      }
    ]
  },

  // TypeScript configuration - Enable checking for production readiness
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint configuration - Enable linting for production readiness
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['app', 'components', 'lib']
  },

  // Server external packages for better performance
  serverExternalPackages: ['pdf-parse', 'mammoth', 'exceljs'],

  // Experimental features for optimization
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js', 'lucide-react'],
  },
};

// Sentry configuration optimized for Vercel deployment
const sentryWebpackPluginOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Only upload source maps in production
  silent: process.env.NODE_ENV !== 'production',

  // Optimized source map configuration for Vercel
  widenClientFileUpload: true,
  transpileClientSDK: true,
  hideSourceMaps: true,
  deleteSourcemapsAfterUpload: true,

  // Use Vercel commit SHA for releases
  release: process.env.VERCEL_GIT_COMMIT_SHA,

  // Disable in development to speed up builds
  disableServerWebpackPlugin: process.env.NODE_ENV !== 'production',
  disableClientWebpackPlugin: process.env.NODE_ENV !== 'production',
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
