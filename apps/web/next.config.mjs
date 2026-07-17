/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    images: {
        remotePatterns: [
            {
                protocol: "http",
                hostname: "localhost",
                port: "9000",
                pathname: "/**",
            },
            {
                protocol: "http",
                hostname: "minio",
                port: "9000",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "images.unsplash.com",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "sterility-glimmer-fruit.ngrok-free.dev",
                pathname: "/**",
            },
        ],
    },
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    { key: "ngrok-skip-browser-warning", value: "true" },
                ],
            },
        ];
    },
};

export default nextConfig;