/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    images: { unoptimized: true },
    env: {
        WEB_APP_URL: "https://oo1rw4fmo5.execute-api.us-east-1.amazonaws.com/Dev/",
        API_URL: "https://oo1rw4fmo5.execute-api.us-east-1.amazonaws.com/Dev/url/",
    },
};

export default nextConfig;
