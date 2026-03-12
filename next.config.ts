/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === "production";
const repo = "votantes-map"; // nombre del repo

const nextConfig = {
  output: "export",
  basePath: isProd ? `/${repo}` : "",
  assetPrefix: isProd ? `/${repo}/` : "",
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
