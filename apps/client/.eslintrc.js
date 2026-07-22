module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'next',
    'next/core-web-vitals',
    'plugin:prettier/recommended',
  ],
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
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['off'],
    'react-hooks/exhaustive-deps': 'off',
    '@next/next/no-img-element': 'off',
    'import/no-anonymous-default-export': 'off',
  },
};
