/** @type {import('next').NextConfig} */

// When deploying to GitHub Pages the site is served from /<repo>, so the CI
// sets PAGES_BASE_PATH (e.g. "/Odin"). Locally it's empty, so dev/preview run
// at the root. The whole site is static, so we use Next's static export.
const basePath = process.env.PAGES_BASE_PATH || "";

const nextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
