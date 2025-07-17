/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production-ready React configuration
  reactStrictMode: true,

  // Optimized for production deployment
  poweredByHeader: false,
  compress: true,

  // Image optimization for all avatar sources
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
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      }
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },

  // Production TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // Production ESLint configuration
  eslint: {
    ignoreDuringBuilds: true,
    dirs: ['app', 'components', 'lib', 'scripts']
  },

  // Server-side external packages for optimal performance
  serverExternalPackages: [
    'pdf-parse',
    'mammoth',
    'exceljs',
    'posthog-node',
    '@sentry/node',
    '@sentry/nextjs'
  ],

  // Minimal experimental features to avoid chunk issues
  experimental: {
    // Removed optimizePackageImports to prevent chunk loading conflicts
  },

  // Production-grade webpack configuration
  webpack: (config, { isServer, dev }) => {
    // Server-side optimizations
    if (isServer) {
      config.externals.push('posthog-node', '@sentry/node');
    }

    // Handle Node.js modules and polyfills
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      readline: false,
      crypto: false,
      stream: false,
      util: false,
      buffer: false,
      events: false,
      path: false,
      os: false,
    };

    // Comprehensive warning suppression for production
    config.ignoreWarnings = [
      // OpenTelemetry warnings
      {
        module: /node_modules\/@opentelemetry/,
        message: /Critical dependency/,
      },
      // Sentry warnings
      {
        module: /node_modules\/@sentry/,
        message: /Critical dependency/,
      },
      // Prisma warnings
      {
        module: /node_modules\/@prisma/,
        message: /Critical dependency/,
      },
      // PostHog warnings
      {
        module: /node_modules\/posthog/,
        message: /Critical dependency/,
      },
      // General dynamic require warnings
      {
        message: /the request of a dependency is an expression/,
      }
    ];

    // Let Next.js handle chunk optimization automatically
    // Removed custom splitChunks configuration to prevent chunk loading issues

    return config;
  },

  // Removed standalone output to prevent chunk loading issues in development

  // Security and performance headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Disable source maps in production for security and performance
  productionBrowserSourceMaps: false,

  // Optimize bundle analyzer
  env: {
    ANALYZE: process.env.ANALYZE,
  },
};

export default nextConfig;
