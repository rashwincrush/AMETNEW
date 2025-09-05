// Storybook configuration for CRA React app using Webpack 5
const path = require('path');
/** @type { import('@storybook/react-webpack5').StorybookConfig } */
module.exports = {
  stories: [
    // Temporarily load only a minimal, known-good story to get SB running
    '../src/components/PermissionGate.stories.js'
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-links',
    '@storybook/preset-create-react-app'
  ],
  staticDirs: ['../public'],
  framework: {
    name: '@storybook/react-webpack5',
    options: {}
  },
  webpackFinal: async (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname, '../src'),
    };
    return config;
  },
  docs: { autodocs: 'tag' }
};
