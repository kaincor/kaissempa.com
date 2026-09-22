import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AVIF first, WebP as the fallback, original format for anything older.
    // AVIF lands roughly 20% smaller than WebP at the cost of ~50% longer
    // encoding on the first request for each size; every request after that is
    // served from cache. Worth it for a page whose weight is mostly photos.
    formats: ["image/avif", "image/webp"],
    // Next 16 requires an allowlist; the default is [75] and anything else is
    // rejected outright rather than clamped. 85 is here for photography, where
    // AVIF holds detail cheaply enough that the extra quality is nearly free.
    qualities: [75, 85],
  },
};

export default nextConfig;
