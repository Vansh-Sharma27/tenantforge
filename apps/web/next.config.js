/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@tenantforge/shared"],
  allowedDevOrigins: ["http://216.81.245.64:3000"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
