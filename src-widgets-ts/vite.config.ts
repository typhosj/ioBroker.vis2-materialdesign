import react from "@vitejs/plugin-react";
import commonjs from "vite-plugin-commonjs";
import vitetsConfigPaths from "vite-tsconfig-paths";
import { federation } from "@module-federation/vite";
import { moduleFederationShared } from "@iobroker/types-vis-2/modulefederation.vis.config";
import { readFileSync } from "node:fs";

const pack = JSON.parse(readFileSync("./package.json").toString());

export default {
  plugins: [
    federation({
      manifest: true,
      name: "vis2MaterialDesignWidgets",
      filename: "customWidgets.js",
      exposes: {
        "./MaterialDesignCard": "./src/MaterialDesignCard",
        "./MaterialDesignMasonryViews": "./src/MaterialDesignMasonryViews",
        "./MaterialDesignGridViews": "./src/MaterialDesignGridViews",
        "./MaterialDesignAdvancedViewInWidget":
          "./src/MaterialDesignAdvancedViewInWidget",
        "./MaterialDesignAdvancedViewInWidget8":
          "./src/MaterialDesignAdvancedViewInWidget8",
        "./MaterialDesignCalendar": "./src/MaterialDesignCalendar",
        "./MaterialDesignChartBar": "./src/MaterialDesignChartBar",
        "./MaterialDesignChartPie": "./src/MaterialDesignChartPie",
        "./MaterialDesignChartJson": "./src/MaterialDesignChartJson",
        "./MaterialDesignChartLineHistory":
          "./src/MaterialDesignChartLineHistory",
        "./MaterialDesignColorScheme": "./src/MaterialDesignColorScheme",
        "./MaterialDesignDialogView": "./src/MaterialDesignDialogView",
        "./MaterialDesignDialogIFrame": "./src/MaterialDesignDialogIFrame",
        "./MaterialDesignAutocomplete": "./src/MaterialDesignAutocomplete",
        "./MaterialDesignAlerts": "./src/MaterialDesignAlerts",
        "./MaterialDesignButtonNavigationVertical":
          "./src/MaterialDesignButtonNavigationVertical",
        "./MaterialDesignButtonLinkVertical":
          "./src/MaterialDesignButtonLinkVertical",
        "./MaterialDesignButtonStateVertical":
          "./src/MaterialDesignButtonStateVertical",
        "./MaterialDesignButtonStateMultiVertical":
          "./src/MaterialDesignButtonStateMultiVertical",
        "./MaterialDesignButtonAditionVertical":
          "./src/MaterialDesignButtonAditionVertical",
        "./MaterialDesignButtonToggleVertical":
          "./src/MaterialDesignButtonToggleVertical",
        "./MaterialDesignButtonNavigation":
          "./src/MaterialDesignButtonNavigation",
        "./MaterialDesignButtonLink": "./src/MaterialDesignButtonLink",
        "./MaterialDesignButtonState": "./src/MaterialDesignButtonState",
        "./MaterialDesignButtonStateMulti":
          "./src/MaterialDesignButtonStateMulti",
        "./MaterialDesignButtonAdition": "./src/MaterialDesignButtonAdition",
        "./MaterialDesignButtonToggle": "./src/MaterialDesignButtonToggle",
        "./MaterialDesignIconButtonNavigation":
          "./src/MaterialDesignIconButtonNavigation",
        "./MaterialDesignIconButtonLink": "./src/MaterialDesignIconButtonLink",
        "./MaterialDesignIconButtonState":
          "./src/MaterialDesignIconButtonState",
        "./MaterialDesignIconButtonStateMulti":
          "./src/MaterialDesignIconButtonStateMulti",
        "./MaterialDesignIconButtonAdition":
          "./src/MaterialDesignIconButtonAdition",
        "./MaterialDesignIconButtonToggle":
          "./src/MaterialDesignIconButtonToggle",
        "./MaterialDesignIconButtonSlider":
          "./src/MaterialDesignIconButtonSlider",
        "./MaterialDesignCheckbox": "./src/MaterialDesignCheckbox",
        "./MaterialDesignIcon": "./src/MaterialDesignIcon",
        "./MaterialDesignIconList": "./src/MaterialDesignIconList",
        "./MaterialDesignList": "./src/MaterialDesignList",
        "./MaterialDesignInput": "./src/MaterialDesignInput",
        "./MaterialDesignInstalledVersion":
          "./src/MaterialDesignInstalledVersion",
        "./MaterialDesignSelect": "./src/MaterialDesignSelect",
        "./MaterialDesignProgress": "./src/MaterialDesignProgress",
        "./MaterialDesignProgressCircular":
          "./src/MaterialDesignProgressCircular",
        "./MaterialDesignRoundSlider": "./src/MaterialDesignRoundSlider",
        "./MaterialDesignSlider": "./src/MaterialDesignSlider",
        "./MaterialDesignSwitch": "./src/MaterialDesignSwitch",
        "./MaterialDesignTable": "./src/MaterialDesignTable",
        "./MaterialDesignTopAppBar": "./src/MaterialDesignTopAppBar",
        "./MaterialDesignValue": "./src/MaterialDesignValue",
        "./translations": "./src/translations",
      },
      remotes: {},
      shared: moduleFederationShared(pack),
      dts: false,
    }),
    react(),
    vitetsConfigPaths(),
    commonjs(),
  ],
  base: "./",
  build: {
    target: "chrome89",
    outDir: "./build",
    rollupOptions: {
      output: {
        // Module federation names its virtual chunks after the whole share path, which since
        // @module-federation/vite 1.16.14 includes an `__mf_owner__1__` infix and reaches 134
        // characters. `<checkout>/widgets/vis2-materialdesign/assets/<name>` then passes Windows'
        // 260-character MAX_PATH, and `git add` fails with "Filename too long" — on the artifacts
        // that ship. The hash keeps truncated names distinct.
        chunkFileNames: (chunk: { name: string }): string =>
          `assets/${chunk.name.slice(0, 60)}-[hash].js`,
      },
      onwarn(
        warning: { code: string },
        warn: (warning: { code: string }) => void,
      ): void {
        if (warning.code === "MODULE_LEVEL_DIRECTIVE") {
          return;
        }
        warn(warning);
      },
    },
  },
};
