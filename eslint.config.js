// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  // Must come last so it can disable stylistic rules that Prettier owns.
  eslintConfigPrettier,
  {
    ignores: ['node_modules/*', '.expo/*', 'dist/*', 'web-build/*'],
  },
  {
    // The hooks layer (src/hooks/*) deliberately relies on
    // `useRef(...).current` for one-time, synchronous construction of
    // Animated.Value/PanResponder instances, and on effects that call
    // setState in response to prop changes (see useChessGame.ts,
    // usePieceAnimations.ts, useBottomSheet.ts, etc.). These are
    // React-Compiler-readiness rules rather than correctness bugs for this
    // codebase's existing, intentional patterns, so they're kept visible as
    // warnings instead of failing `npm run lint`.
    rules: {
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]);
