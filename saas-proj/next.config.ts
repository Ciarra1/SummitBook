import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // THIS IS THE MAGIC LINE THAT FIXES VERCEL/NETLIFY 404s
  outputFileTracingRoot: path.join(__dirname), 
  
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "app.saas-proj.dev"],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'lckpglsjyurwcuilycky.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};

export default nextConfig;