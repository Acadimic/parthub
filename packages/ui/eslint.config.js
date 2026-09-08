// ESLint 9 flat config, written as ESM because this package is `type: module`.
// `packages/ui` had no lint config at all, so the shared components were never checked even
// though all three apps compile them from source.
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

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

      // A prop pulled out of a `...rest` spread on purpose, or a deliberately unused
      // parameter, is named with a leading underscore.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { args: 'after-used', argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],

      // Data must have a declared type. `unknown` plus narrowing is the escape hatch, not `any`.
      '@typescript-eslint/no-explicit-any': 'error',

      // Annotation style is left to the author; `noImplicitAny` in tsconfig covers the real gap.
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
];
