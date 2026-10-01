/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
  ...(process.env.THATI_BUILD_DIR ? { distDir: process.env.THATI_BUILD_DIR } : {}),
};

export default config;
