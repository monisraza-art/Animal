import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '**', // This allows all paths under this hostname
      },
      // You can add configurations for other external image hosts here
    ],
  },
};

export default nextConfig;