const { withAndroidManifest } = require('expo/config-plugins');

// app.json holds the config; this refuses a store build that would talk to
// anything but an https server - a release build falls back to
// http://localhost:3000 otherwise (src/network/env.ts), which no phone
// reaches - and lets a local release build (no EAS profile) reach a dev
// server over plain http, which Android's release builds refuse by
// default. iOS needs nothing: it allows http to an address on the local
// network (app.json's NSAllowsLocalNetworking, and raw IPs).
module.exports = ({ config }) => {
  const profile = process.env.EAS_BUILD_PROFILE;
  const url = process.env.EXPO_PUBLIC_SERVER_URL ?? '';
  if (
    (profile === 'production' || profile === 'preview') &&
    !url.startsWith('https://')
  ) {
    throw new Error(
      `EAS profile "${profile}" needs EXPO_PUBLIC_SERVER_URL to be an https URL (got "${url}") - see eas.json`,
    );
  }
  if (!profile && url.startsWith('http://')) {
    return withAndroidManifest(config, (manifest) => {
      manifest.modResults.manifest.application[0].$[
        'android:usesCleartextTraffic'
      ] = 'true';
      return manifest;
    });
  }
  return config;
};
