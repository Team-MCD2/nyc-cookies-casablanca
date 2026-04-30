/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: false,
  images: {
    remotePatterns: [
      // Supabase storage public URLs (product images, etc.)
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
