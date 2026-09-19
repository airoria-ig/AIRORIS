import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.spaceshooter.app',
  appName: 'Space Side-Scroller',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  android: {
    backgroundColor: '#020617',
    allowMixedContent: true,
  },
};

export default config;
