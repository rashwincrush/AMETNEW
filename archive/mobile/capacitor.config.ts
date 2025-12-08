import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.amet.alumni',
  appName: 'AMET Alumni Network',
  webDir: '../frontend/build',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'http',
    iosScheme: 'http'
  }
};

export default config;
