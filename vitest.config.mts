import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        // src-admin is not otherwise unit-tested, but themeConfig.ts is the code that decides which
        // ioBroker objects the adapter creates - the one piece of admin logic every widget depends on.
        include: ['src-widgets-ts/src/**/*.test.{ts,tsx}', 'src-admin/src/**/*.test.{ts,tsx}'],
        setupFiles: ['test/widgets.setup.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json-summary'],
            reportsDirectory: 'coverage',
            include: ['src-widgets-ts/src/**/*.{ts,tsx}'],
            // Everything below is a 3-16 line registration shim - one createButtonClass(...) /
            // createViewClass(...) call with no branch in it. They are excluded so the percentages
            // describe the code that can actually be wrong, not ~30 files of boilerplate that would
            // inflate them. Anything with logic belongs in the measurement, not here.
            exclude: [
                'src-widgets-ts/src/**/*.test.{ts,tsx}',
                'src-widgets-ts/src/**/*.d.ts',
                'src-widgets-ts/src/generated/**',
                'src-widgets-ts/src/index.tsx',
                'src-widgets-ts/src/translations.ts',
                'src-widgets-ts/src/MaterialDesignAdvancedViewInWidget*.tsx',
                'src-widgets-ts/src/MaterialDesignButton{Adition,Link,Navigation,State,StateMulti,Toggle}{,Vertical}.tsx',
                'src-widgets-ts/src/MaterialDesignIconButton*.tsx',
                'src-widgets-ts/src/MaterialDesign{Checkbox,Switch}.tsx',
                'src-widgets-ts/src/MaterialDesignDialog{View,IFrame}.tsx',
                'src-widgets-ts/src/MaterialDesign{Grid,Masonry}Views.tsx',
            ],
            // One point under the measured values (64.67 / 53.61 / 60.64 / 65.98), so removing a
            // test trips the gate. The previous numbers sat ~20 points under the real coverage and
            // could only have failed after a collapse, which is not a gate. Re-measure and raise
            // these whenever a batch of tests lands; never lower them to make a red run green.
            thresholds: {
                statements: 64,
                branches: 53,
                functions: 60,
                lines: 65,
            },
        },
    },
});
