import react from '@vitejs/plugin-react';
import commonjs from 'vite-plugin-commonjs';
import vitetsConfigPaths from 'vite-tsconfig-paths';
import { federation } from '@module-federation/vite';
import { moduleFederationShared } from '@iobroker/types-vis-2/modulefederation.vis.config';
import { readFileSync } from 'node:fs';

const pack = JSON.parse(readFileSync('./package.json').toString());

export default {
    plugins: [
        federation({
            manifest: true,
            name: 'vis2MaterialDesignWidgets',
            filename: 'customWidgets.js',
            exposes: {
                './MaterialDesignButtonNavigationVertical': './src/MaterialDesignButtonNavigationVertical',
                './MaterialDesignButtonLinkVertical': './src/MaterialDesignButtonLinkVertical',
                './MaterialDesignButtonStateVertical': './src/MaterialDesignButtonStateVertical',
                './MaterialDesignButtonStateMultiVertical': './src/MaterialDesignButtonStateMultiVertical',
                './MaterialDesignButtonAditionVertical': './src/MaterialDesignButtonAditionVertical',
                './MaterialDesignButtonToggleVertical': './src/MaterialDesignButtonToggleVertical',
                './MaterialDesignButtonNavigation': './src/MaterialDesignButtonNavigation',
                './MaterialDesignButtonLink': './src/MaterialDesignButtonLink',
                './MaterialDesignButtonState': './src/MaterialDesignButtonState',
                './MaterialDesignButtonStateMulti': './src/MaterialDesignButtonStateMulti',
                './MaterialDesignButtonAdition': './src/MaterialDesignButtonAdition',
                './MaterialDesignButtonToggle': './src/MaterialDesignButtonToggle',
                './MaterialDesignIconButtonNavigation': './src/MaterialDesignIconButtonNavigation',
                './MaterialDesignIconButtonLink': './src/MaterialDesignIconButtonLink',
                './MaterialDesignIconButtonState': './src/MaterialDesignIconButtonState',
                './MaterialDesignIconButtonStateMulti': './src/MaterialDesignIconButtonStateMulti',
                './MaterialDesignIconButtonAdition': './src/MaterialDesignIconButtonAdition',
                './MaterialDesignIconButtonToggle': './src/MaterialDesignIconButtonToggle',
                './MaterialDesignIconButtonSlider': './src/MaterialDesignIconButtonSlider',
                './MaterialDesignCheckbox': './src/MaterialDesignCheckbox',
                './MaterialDesignIcon': './src/MaterialDesignIcon',
                './MaterialDesignProgress': './src/MaterialDesignProgress',
                './MaterialDesignProgressCircular': './src/MaterialDesignProgressCircular',
                './MaterialDesignSwitch': './src/MaterialDesignSwitch',
                './MaterialDesignValue': './src/MaterialDesignValue',
                './translations': './src/translations',
            },
            remotes: {},
            shared: moduleFederationShared(pack),
            dts: false,
        }),
        react(),
        vitetsConfigPaths(),
        commonjs(),
    ],
    base: './',
    build: {
        target: 'chrome89',
        outDir: './build',
        rollupOptions: {
            onwarn(warning: { code: string }, warn: (warning: { code: string }) => void): void {
                if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
                    return;
                }
                warn(warning);
            },
        },
    },
};
