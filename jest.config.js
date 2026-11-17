// Every test runs twice, as iOS and as Android - jest-expo's platform
// presets set Platform.OS and resolve `.ios`/`.android` files - so a
// Platform branch is exercised both ways. `npm test -- --selectProjects
// android` runs one of them.
const shared = {
  resolver: 'react-native-reanimated/jest/resolver',
  // Gesture Handler's own mocks of its native module and gesture detector,
  // so gestures can be fired from tests (react-native-gesture-handler/jest-utils).
  setupFiles: ['react-native-gesture-handler/jestSetup'],
  setupFilesAfterEnv: ['./jest-setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|chess.js)',
  ],
};

/** @type {import('jest').Config} */
module.exports = {
  // Jest's default, a worker per core but one, left a laptop running other
  // apps so short of CPU that tests ran past their 5s timeout (and their
  // updates landed after they'd ended, outside act). Half the cores ran the
  // suite faster there; CI's 4-core runner keeps the default.
  ...(process.env.CI ? {} : { maxWorkers: '50%' }),
  // A worker that's grown past this is started afresh between files: one
  // that had run hundreds of them took too long to exit at the end and was
  // killed ("A worker process has failed to exit gracefully").
  workerIdleMemoryLimit: '1GB',
  projects: [
    {
      ...shared,
      preset: 'jest-expo/ios',
      displayName: { name: 'ios', color: 'blue' },
    },
    {
      ...shared,
      preset: 'jest-expo/android',
      displayName: { name: 'android', color: 'green' },
    },
  ],
};
