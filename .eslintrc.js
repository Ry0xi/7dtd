/** @type {import('eslint').Linter.Config} */
const config = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: 'tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
    },
    plugins: [
        '@typescript-eslint/eslint-plugin',
        'jest',
        'unused-imports',
        'import',
        'no-relative-import-paths',
    ],
    extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:prettier/recommended',
    ],
    root: true,
    env: {
        node: true,
        jest: true,
    },
    ignorePatterns: [
        'node_modules',
        '.eslintrc.js',
        'dist',
        'cdk.out',
        '.cdk.staging',
    ],
    rules: {
        '@typescript-eslint/interface-name-prefix': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/consistent-type-imports': [
            'warn',
            {
                prefer: 'type-imports',
            },
        ],
        '@typescript-eslint/switch-exhaustiveness-check': 'error',
        'no-restricted-syntax': [
            'warn',
            {
                selector: 'ForInStatement',
                message:
                    'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
            },
        ],
        'prefer-arrow-callback': 'warn',
        'prefer-const': 'warn',
        'prefer-template': 'warn',
        'arrow-body-style': ['warn', 'as-needed'],
        'no-unused-vars': 'off',
        'unused-imports/no-unused-imports': 'error',
        'unused-imports/no-unused-vars': [
            'warn',
            {
                vars: 'all',
                varsIgnorePattern: '^_',
                args: 'after-used',
                argsIgnorePattern: '^_',
            },
        ],
        'import/order': [
            'warn',
            {
                pathGroups: [
                    {
                        pattern: '@/**',
                        group: 'parent',
                        position: 'before',
                    },
                    {
                        pattern: '@test/**',
                        group: 'parent',
                        position: 'before',
                    },
                ],
                pathGroupsExcludedImportTypes: ['builtin'],
                alphabetize: {
                    order: 'asc',
                },
                'newlines-between': 'always',
            },
        ],
        'no-relative-import-paths/no-relative-import-paths': [
            'warn',
            {
                allowSameFolder: false,
                prefix: '@',
            },
        ],
        '@typescript-eslint/explicit-member-accessibility': [
            'warn',
            {
                accessibility: 'explicit',
                overrides: {
                    constructors: 'no-public',
                },
            },
        ],
        'jest/consistent-test-it': ['warn', { fn: 'it' }],
        'jest/require-top-level-describe': 'warn',
    },
    settings: {
        'import/resolver': {
            typescript: {},
        },
        'import/parsers': {
            '@typescript-eslint/parser': ['.ts', '.tsx'],
        },
    },
};

module.exports = config;
