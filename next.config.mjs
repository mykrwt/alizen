/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // No server-side data fetching that requires a database.
  // Everything is static or uses browser-side API calls with user keys.
  experimental: {
    // Optimize for client-heavy app
    optimizePackageImports: ['lucide-react'],
  },
  // We don't need image optimization remote hosts — keep it simple
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        // Allow the sandboxed preview iframe to run safely
        source: '/preview/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig;
