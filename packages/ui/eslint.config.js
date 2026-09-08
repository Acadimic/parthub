// ESLint 9 flat config, written as ESM because this package is `type: module`.
// `packages/ui` had no lint config at all, so the shared components were never checked even
// though all three apps compile them from source.
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import sharedConfig from '@repo/eslint-config';

const { mustRules, shouldRules, layerRules } = sharedConfig;

export default [
  { ignores: ['node_modules/**', 'eslint.config.js'] },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: 'tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: { '@typescript-eslint': tsPlugin, prettier: prettierPlugin },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
      ...mustRules,
      ...shouldRules,
      ...layerRules.ui,

      // Annotation style is left to the author; `strict` in tsconfig covers the real gap.
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
];
