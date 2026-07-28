import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        // The admin bundle is not otherwise unit-tested, but the M3 scheme generator lives there by
        // design (Phase 9.1: the color math must not reach the widget runtime) and it is the one
        // piece of admin code whose output every M3 widget depends on.
        include: ['src-widgets-ts/src/**/*.test.{ts,tsx}', 'src-admin/src/**/*.test.{ts,tsx}'],
        setupFiles: ['test/widgets.setup.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json-summary'],
            reportsDirectory: 'coverage',
            include: ['src-widgets-ts/src/**/*.{ts,tsx}'],
            exclude: [
                'src-widgets-ts/src/**/*.test.{ts,tsx}',
                'src-widgets-ts/src/**/*.d.ts',
                'src-widgets-ts/src/generated/**',
                'src-widgets-ts/src/index.tsx',
                'src-widgets-ts/src/translations.ts',
                'src-widgets-ts/src/MaterialDesignAutocomplete.tsx',
                'src-widgets-ts/src/MaterialDesignAdvancedViewInWidget*.tsx',
                'src-widgets-ts/src/MaterialDesignButton.tsx',
                'src-widgets-ts/src/MaterialDesignButton{Adition,Link,Navigation,State,StateMulti,Toggle}{,Vertical}.tsx',
                'src-widgets-ts/src/MaterialDesignIconButton*.tsx',
                'src-widgets-ts/src/MaterialDesign{Checkbox,Switch}.tsx',
                'src-widgets-ts/src/MaterialDesignDialog{View,IFrame}.tsx',
                'src-widgets-ts/src/MaterialDesign{Grid,Masonry}Views.tsx',
            ],
            thresholds: {
                statements: 40,
                branches: 27,
                functions: 35,
                lines: 38,
            },
        },
    },
});
