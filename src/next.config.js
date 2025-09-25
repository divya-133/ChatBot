/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias['canvg'] = false;
    config.resolve.alias['html2canvas'] = false;
    return config;
  },
};

module.exports = nextConfig;  