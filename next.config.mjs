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

  // ESLint configuration - Allow deployment while cleaning warnings
  eslint: {
    ignoreDuringBuilds: true,
    dirs: ['app', 'components', 'lib']
  },

  // Server external packages for better performance
  serverExternalPackages: ['pdf-parse', 'mammoth', 'exceljs', 'posthog-node'],

  // Experimental features for optimization
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js', 'lucide-react'],
  },

  // Webpack configuration to handle Node.js modules
  webpack: (config, { isServer }) => {
    // Handle Node.js modules for PostHog and other packages
    if (isServer) {
      config.externals.push('posthog-node');
    }

    // Handle node: protocol imports
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      readline: false,
      crypto: false,
      stream: false,
      util: false,
      buffer: false,
      events: false,
    };

    return config;
  },
};

// Export plain Next.js config to avoid Sentry build issues on Vercel
// Sentry will still work at runtime via the client initialization
export default nextConfig;
