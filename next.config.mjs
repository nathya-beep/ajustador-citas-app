/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/es",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
