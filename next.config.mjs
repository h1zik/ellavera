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
  // nodemailer pakai require dinamis — jangan di-bundle webpack, load dari node_modules.
  experimental: {
    serverComponentsExternalPackages: ["nodemailer"],
  },
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
      {
        protocol: "https",
        hostname: "api.mibchemicals.com",
        pathname: "/storage/v1/object/public/**",
      },
      // Legacy cloud URLs (sementara, sampai semua record di DB ter-rewrite)
      {
        protocol: "https",
        hostname: "ykaxxnsnlimpqhzvvsrz.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      ...supabaseImageHosts(),
    ],
  },
};

export default nextConfig;
