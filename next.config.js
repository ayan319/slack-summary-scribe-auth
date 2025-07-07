import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable strict mode for better development experience
  reactStrictMode: true,

  // Page extensions
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],

  // Image optimization
  images: {
    domains: ['avatars.slack-edge.com', 'secure.gravatar.com', 'lh3.googleusercontent.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.slack-edge.com',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      }
    ]
  },

  // TypeScript configuration - Enable checking for production readiness
  typescript: {
    ignoreBuildErrors: false, // Enable TypeScript checking
  },

  // ESLint configuration - Enable linting for production readiness
  eslint: {
    ignoreDuringBuilds: false, // Enable ESLint checking
    dirs: ['app', 'components', 'lib', 'scripts']
  },

  // Server external packages (moved from experimental)
  serverExternalPackages: ['pdf-parse', 'mammoth', 'exceljs', '@prisma/client'],

  // Experimental features
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js', 'lucide-react'],
  },

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

// Enhanced Sentry configuration with source maps
const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry webpack plugin
  org: process.env.SENTRY_ORG || 'slack-summary-scribe',
  project: process.env.SENTRY_PROJECT || 'slack-summary-scribe',
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Only upload source maps in production
  silent: process.env.NODE_ENV !== 'production',

  // Enhanced source map configuration
  widenClientFileUpload: true,
  transpileClientSDK: true,
  tunnelRoute: '/monitoring',

  // Source map settings
  hideSourceMaps: true,
  deleteSourcemapsAfterUpload: true,

  // Release configuration
  release: process.env.VERCEL_GIT_COMMIT_SHA || process.env.npm_package_version,

  // Enhanced error tracking
  errorHandler: (err, invokeErr, compilation) => {
    if (compilation && compilation.warnings) {
      compilation.warnings.push('Sentry CLI Plugin: ' + err.message);
    } else {
      console.warn('Sentry CLI Plugin:', err.message);
    }
  },

  // Disable source map upload in development
  disableServerWebpackPlugin: process.env.NODE_ENV !== 'production',
  disableClientWebpackPlugin: process.env.NODE_ENV !== 'production',

  // Additional webpack configuration
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
