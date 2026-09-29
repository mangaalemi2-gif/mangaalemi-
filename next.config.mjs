import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["mangaalemi-storage.r2.cloudflarestorage.com"], // Cloudflare R2 için görsel domain izni
  },
};

export default nextConfig;
