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
]);
