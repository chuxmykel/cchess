// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  {
    // Every color the app draws comes from the theme (src/theme/), so light
    // and dark mode - and any change to the palette - are made in one place.
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores: [
      'src/theme/**',
      '**/__tests__/**',
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      'src/testUtils/**',
      'scripts/**',
      'jest-setup.js',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'Literal[value=/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]',
          message:
            'Use a color from the theme (src/theme/) instead of a hex literal.',
        },
        {
          selector: 'Literal[value=/^rgba?\\(/]',
          message:
            'Use a color from the theme (src/theme/) instead of an rgb() literal.',
        },
      ],
    },
  },
  // Must come last so it can disable stylistic rules that Prettier owns.
  eslintConfigPrettier,
  {
    ignores: ['node_modules/*', '.expo/*', 'dist/*', 'web-build/*'],
  },
]);
