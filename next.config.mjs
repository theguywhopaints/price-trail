/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.googleapis.com' },
      { protocol: 'https', hostname: '**.amazon.com' },
      { protocol: 'https', hostname: '**.walmart.com' },
      { protocol: 'https', hostname: '**.bestbuy.com' },
      { protocol: 'https', hostname: '**.ebayimg.com' },
      { protocol: 'https', hostname: 'serpapi.com' },
    ],
  },
}

export default nextConfig;
