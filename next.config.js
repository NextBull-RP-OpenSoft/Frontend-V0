/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://34.93.4.23:4000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
