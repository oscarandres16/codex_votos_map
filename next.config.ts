/** @type {import('next').NextConfig} */

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const normalizedBasePath = basePath === "/" ? "" : basePath;

const nextConfig = {
  output: "export",
  basePath: normalizedBasePath,
  assetPrefix: normalizedBasePath ? `${normalizedBasePath}/` : "",
  env: {
    NEXT_PUBLIC_BASE_PATH: normalizedBasePath,
  },
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
