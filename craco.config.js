// craco.config.js
const { InjectManifest } = require('workbox-webpack-plugin');

module.exports = {
  webpack: {
    plugins: {
      add: [
        new InjectManifest({
          swSrc: './src/service-worker.ts',
          swDest: 'service-worker.js',
          exclude: [/\.map$/, /asset-manifest\.json$/],
        }),
      ],
    },
  },
};
