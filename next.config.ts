import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    'preview-chat-284709c5-067b-4d48-85d8-e985772e477c.space-z.ai',
    '*.space-z.ai',
    'localhost',
    '127.0.0.1',
  ],
};

export default nextConfig;
