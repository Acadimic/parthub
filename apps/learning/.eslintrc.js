const { mustRules, shouldRules, layerRules } = require('@repo/eslint-config');

module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ['next', 'next/core-web-vitals', 'plugin:prettier/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: { jsx: true },
    ecmaVersion: 'latest',
    sourceType: 'module',
    tsconfigRootDir: __dirname,
    project: './tsconfig.json',
  },
  plugins: ['react', '@typescript-eslint', 'prettier'],
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    ...mustRules,
    ...shouldRules,
    ...layerRules.app,

    // The base rule does not understand types; the @typescript-eslint one in shouldRules does.
    'no-unused-vars': 'off',

    // Deliberately off for this codebase.
    'react-hooks/exhaustive-deps': 'off',
    '@next/next/no-img-element': 'off',
    'import/no-anonymous-default-export': 'off',
  },
};
