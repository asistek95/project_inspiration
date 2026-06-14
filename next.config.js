/** @type {import('next').NextConfig} */
const nextConfig = {
  // StrictMode deaktiviert: eliminiert Doppel-Renders in Dev → deutlich schnellere Navigation
  reactStrictMode: false,
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
};
module.exports = nextConfig;
