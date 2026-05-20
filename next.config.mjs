/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: false,
  images: {
    remotePatterns: [
      // Supabase storage public URLs (product images, etc.)
      { protocol: "https", hostname: "*.supabase.co" },
      // Cloudinary
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Pollinations AI for dynamic images
      { protocol: "https", hostname: "image.pollinations.ai" },
    ],
  },
};

export default nextConfig;
