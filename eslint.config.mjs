import config from '@iobroker/eslint-config';

export default [
    {
        // Legacy VIS1 widgets, generated VIS2/admin bundles, tests and examples are not
        // hand-maintained TypeScript and must not be linted (upstream-#251).
        ignores: [
            'widgets/**',
            'admin/**',
            'src-widgets-ts/build/**',
            'test/**',
            'examples/**',
            'node_modules/**',
            'tasks.js',
            '*.config.mjs',
        ],
    },
    ...config,
    {
        // Maintained widget + admin source. The ported widgets deliberately use a
        // compact single-line style; prettier/jsdoc/brace-opinion rules fight that and
        // add no correctness value, so only the correctness rules stay active.
        files: ['src-widgets-ts/src/**/*.{ts,tsx}', 'src-admin/src/**/*.{ts,tsx}'],
        rules: {
            // Formatting / documentation opinions (compact single-line widget style).
            'prettier/prettier': 'off',
            'jsdoc/require-jsdoc': 'off',
            'jsdoc/require-param': 'off',
            'jsdoc/require-returns': 'off',
            'jsdoc/require-param-description': 'off',
            curly: 'off',
            'brace-style': 'off',
            // Type-style opinions that do not indicate bugs; kept off to avoid churning
            // the deliberately terse widget source. Correctness rules stay inherited.
            '@typescript-eslint/consistent-type-imports': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',
        },
    },
];
