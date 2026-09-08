// ESLint 9 flat config. `packages/shared` had no lint config at all, so nothing in it was checked.
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const prettierPlugin = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');
const { mustRules, shouldRules, layerRules } = require('@repo/eslint-config');

module.exports = [
  { ignores: ['dist/**', 'node_modules/**', 'eslint.config.js'] },
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { project: 'tsconfig.json', tsconfigRootDir: __dirname, sourceType: 'module' },
    },
    plugins: { '@typescript-eslint': tsPlugin, prettier: prettierPlugin },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
      ...mustRules,
      ...shouldRules,
      ...layerRules.shared,

      // Annotation style is left to the author; `strict` in tsconfig covers the real gap.
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
];
