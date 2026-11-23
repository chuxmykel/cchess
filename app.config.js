// app.json holds the config; this only refuses a store build that would
// talk to anything but an https server - a release build falls back to
// http://localhost:3000 otherwise (src/network/env.ts), which no phone
// reaches.
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
  return config;
};
