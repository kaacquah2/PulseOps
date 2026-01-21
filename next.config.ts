import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable Turbopack for faster development builds
  turbopack: {
    root: process.cwd(),
  },

  // Optimize production builds
  reactStrictMode: true,
  
  // Optimize images
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
  },

  // Compiler optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error", "warn"],
    } : false,
  },

  // Optimize icon imports from lucide-react
  modularizeImports: {
    "lucide-react": {
      transform: "lucide-react/dist/esm/icons/{{kebabCase member}}",
    },
  },

  // Output optimization for deployment
  output: process.env.NODE_ENV === "production" ? "standalone" : undefined,

  // Enable experimental features for better performance
  experimental: {
    // Optimize CSS
    optimizeCss: true,
    // Optimize package imports
    optimizePackageImports: ["lucide-react", "recharts", "date-fns"],
    // Enable server actions if needed
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  // Configure webpack for production optimization
  webpack: (config, { isServer }) => {
    // Optimize bundle size
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for node_modules
            vendor: {
              name: "vendor",
              chunks: "all",
              test: /node_modules/,
              priority: 20,
            },
            // Common chunk for shared components
            common: {
              name: "common",
              minChunks: 2,
              chunks: "all",
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      };
    }

    return config;
  },

  // Enable production source maps for debugging (optional)
  productionBrowserSourceMaps: false,
};

export default nextConfig;
