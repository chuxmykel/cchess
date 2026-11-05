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
  // The chessboard (src/lib/chessboard/) is written as a package of its own,
  // so another board library could take its place: it uses nothing of the
  // app's, and the app reaches it only through the adapter in
  // src/components/Board/, by its index. Tests and their helpers may reach
  // in further.
  {
    files: ['src/lib/chessboard/**/*.{ts,tsx}'],
    ignores: ['**/__tests__/**', '**/*.test.{ts,tsx}'],
    rules: {
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './src/lib/chessboard',
              from: './src',
              except: ['./lib/chessboard'],
              message:
                'The chessboard library uses nothing from the app: pass what it needs in as props.',
            },
          ],
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'chess.js',
              message:
                "The chessboard library knows no chess rules: legal moves come in as `movable.dests`, and its own types are in './types'.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      'src/lib/chessboard/**',
      'src/components/Board/**',
      '**/__tests__/**',
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      'src/testUtils/**',
    ],
    rules: {
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './src',
              from: './src/lib/chessboard',
              message:
                'Use the boards in src/components/Board/, the only app code that uses the chessboard library.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/components/Board/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './src/components/Board',
              from: './src/lib/chessboard',
              except: ['./index.ts'],
              message:
                "Use the chessboard library by its index ('../../lib/chessboard'), as a package would be.",
            },
          ],
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
