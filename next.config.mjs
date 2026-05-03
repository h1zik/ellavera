/** Pola gambar untuk next/image — tambah host Supabase saat build jika env tersedia. */
function supabaseImageHosts() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) {
    return [];
  }
  try {
    const host = new URL(raw).hostname;
    return [
      {
        protocol: "https",
        hostname: host,
        pathname: "/storage/v1/object/public/**",
      },
    ];
  } catch {
    return [];
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      ...supabaseImageHosts(),
    ],
  },
};

export default nextConfig;
