// ESLint 9 flat config. Replaces .eslintrc.js, which ESLint 10 no longer reads at all.
//
// Next's rules come from @next/eslint-plugin-next directly rather than through
// eslint-config-next: that wrapper peers `eslint ^7 || ^8 || ^9`, so it would cap the whole
// repo below ESLint 10, while the plugin itself declares no peer at all.
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const reactHooks = require('eslint-plugin-react-hooks');
// eslint-plugin-react is deliberately absent: its latest release (7.37.5) peers at eslint ^9.7,
// and this config enabled none of its rules — the React-specific checks come from
// @next/eslint-plugin-next. It can come back when it supports ESLint 10.
const nextPlugin = require('@next/eslint-plugin-next');
const prettierPlugin = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');
const { mustRules, shouldRules, layerRules } = require('@repo/eslint-config');

module.exports = [
  { ignores: ['.next/**', 'node_modules/**', 'eslint.config.js', '*.config.js'] },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooks,
      '@next/next': nextPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
      ...mustRules,
      ...shouldRules,
      ...layerRules.app,

      // The base rule does not understand types; the @typescript-eslint one in shouldRules does.
      'no-unused-vars': 'off',

      // Deliberately off for this codebase.
      'react-hooks/exhaustive-deps': 'off',
      '@next/next/no-img-element': 'off',

      // Annotation style is left to the author; `strict` in tsconfig covers the real gap.
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
];
