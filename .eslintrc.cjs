module.exports = {
  root: true,
  env: { browser: true, node: true, es2022: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    extraFileExtensions: ['.vue'],
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: ['vue', '@typescript-eslint'],
  rules: {
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/ban-ts-comment': 'off',
    'vue/multi-word-component-names': 'off',
    'vue/max-attributes-per-line': 'off',
    'vue/require-default-prop': 'off',
  },
  ignorePatterns: ['.nuxt/', 'node_modules/', 'dist/', '.output/', '.nitro/', '.data/', '.cache/'],
}
