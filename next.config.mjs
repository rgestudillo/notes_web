import webpack from 'webpack';

/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer, dev }) => {
        // Suppress errors during build and development
        config.plugins.push({
            apply: (compiler) => {
                compiler.hooks.done.tap("IgnoreErrorPlugin", (stats) => {
                    stats.compilation.errors = stats.compilation.errors.filter(
                        (error) => !error.message.includes("Promise.withResolvers")
                    );
                });
            },
        });

        return config;
    },
    eslint: {
        ignoreDuringBuilds: true, // Ignore ESLint errors during build
    },
};

export default nextConfig;
