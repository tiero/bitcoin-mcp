import prettierPlugin from 'eslint-plugin-prettier';

export default [
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    rules: {
      'prettier/prettier': 'error',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single']
    },
    plugins: {
      prettier: prettierPlugin
    },
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
  },
];
