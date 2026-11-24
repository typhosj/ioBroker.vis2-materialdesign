import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    outputDir: './test-results',
    reporter: [['list'], ['html', { outputFolder: './playwright-report', open: 'never' }]],
    snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
    use: { baseURL: 'http://localhost:4173/', ...devices['Desktop Chrome'], locale: 'en-US', timezoneId: 'Europe/Berlin' },
    webServer: { command: 'node gallery/scripts/serve.mjs 4173', cwd: '..', port: 4173, reuseExistingServer: !process.env.CI },
    expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.002, animations: 'disabled' } },
    projects: [
        { name: 'smoke', testMatch: /smoke\.spec\.ts/ },
        { name: 'visual', testMatch: /visual\.spec\.ts/ },
        { name: 'media', testMatch: /media\.spec\.ts/ },
    ],
});
