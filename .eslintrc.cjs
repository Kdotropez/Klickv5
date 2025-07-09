module.exports = {
    env: {
        browser: true,
        es2020: true,
    },
    extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
    ],
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
    },
    plugins: ['react', 'react-hooks', 'react-refresh'],
    rules: {
        'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
        'react/prop-types': 'off',
    },
}