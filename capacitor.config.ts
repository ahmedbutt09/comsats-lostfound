import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.findit.app',
  appName: 'COMSATS LOST & FOUND',
  webDir: 'build',
  // Add the plugins section below
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#003366", // COMSATS Blue
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      spinnerColor: "#FF6600", // COMSATS Orange
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
