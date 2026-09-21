import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AVIF first, WebP as the fallback, original format for anything older.
    // AVIF lands roughly 20% smaller than WebP at the cost of ~50% longer
    // encoding on the first request for each size; every request after that is
    // served from cache. Worth it for a page whose weight is mostly photos.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
