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

// Export plain Next.js config to avoid Sentry build issues on Vercel
// Sentry will still work at runtime via the client initialization
export default nextConfig;
