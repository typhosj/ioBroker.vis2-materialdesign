"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

function readJson(file) {
    return JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
}

function walk(dir, predicate, files = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(full, predicate, files);
        } else if (predicate(full)) {
            files.push(full);
        }
    }
    return files;
}

const pkg = readJson("package.json");
const io = readJson("io-package.json");

assert.strictEqual(pkg.name, `iobroker.${io.common.name}`);
assert.strictEqual(pkg.version, io.common.version);
assert.strictEqual(pkg.license, io.common.licenseInformation.license);
assert.strictEqual(pkg.repository.type, "git");
assert.ok(fs.existsSync(path.join(root, pkg.main)), "package.json main must exist");
assert.ok(fs.existsSync(path.join(root, "README.md")), "README.md must exist");
assert.ok(fs.existsSync(path.join(root, "LICENSE")), "LICENSE must exist");
assert.ok(Object.keys(io.common.news).length <= 7, "common.news must contain maximum 7 entries");
assert.ok(!io.common.main, "WWW-only adapter must not point to missing main.js");
assert.strictEqual(io.common.onlyWWW, true);
assert.strictEqual(io.native.sentryReport, false);
assert.strictEqual(io.common.adminUI.config, "html", "React admin must use the HTML admin UI");
assert.ok(fs.existsSync(path.join(root, "admin", "index.html")), "React admin build entry point must exist");
assert.ok(fs.existsSync(path.join(root, "admin", "assets", "index.js")), "React admin bundle must exist");
assert.ok(fs.existsSync(path.join(root, "src-admin", "src", "main.tsx")), "React admin source must exist");

const sentry = io.instanceObjects.find((obj) => obj._id === "sentry");
assert.ok(sentry, "sentry state must exist");
assert.strictEqual(sentry.common.def, false);

const widgetRegistry = io.common.visWidgets.vis2MaterialDesignWidgets;
assert.ok(widgetRegistry, "VIS2 widget registry must exist");
const vite = fs.readFileSync(path.join(root, "src-widgets-ts", "vite.config.ts"), "utf8");
const exposedComponents = [...vite.matchAll(/["']\.\/(MaterialDesign[^"']+)["']\s*:/g)].map((match) => match[1]).sort();
assert.deepStrictEqual(
    [...widgetRegistry.components].sort(),
    exposedComponents,
    "io-package.json components and Vite MaterialDesign exposes must match exactly",
);
const widgetUtils = fs.readFileSync(path.join(root, "src-widgets-ts", "src", "widgetUtils.tsx"), "utf8");
assert.ok(widgetUtils.includes("name: 'useTheme'"), "all VIS2 widgets must expose the legacy theme action");
assert.ok(widgetUtils.includes("__mdwThemeDark"), "VIS2 widgets must subscribe to the theme selector state");
assert.ok(widgetUtils.includes("applyThemeVariables"), "VIS2 widgets must apply theme state values as CSS variables");
const requiredComponents = [
    "MaterialDesignCalendar",
    "MaterialDesignChartBar",
    "MaterialDesignChartPie",
    "MaterialDesignChartJson",
    "MaterialDesignChartLineHistory",
    "MaterialDesignDialogView",
    "MaterialDesignDialogIFrame",
    "MaterialDesignMasonryViews",
    "MaterialDesignGridViews",
    "MaterialDesignAdvancedViewInWidget",
    "MaterialDesignAdvancedViewInWidget8",
];
for (const component of requiredComponents) {
    assert.ok(widgetRegistry.components.includes(component), `${component} must be registered in io-package.json`);
    assert.ok(vite.includes(`./${component}`), `${component} must be exposed by Vite`);
    assert.ok(fs.existsSync(path.join(root, "src-widgets-ts", "src", `${component}.tsx`)), `${component} source must exist`);
}

// Every ported widget must be registered in io-package.json, exposed by Vite, and have source.
// This list used to be cross-checked against the VIS1 legacy templates in
// widgets/materialdesign.html; that legacy bundle has been removed, so the list is now the
// authoritative set of VIS2 counterparts on its own.
const portedComponents = [
    "MaterialDesignAlerts",
    "MaterialDesignAutocomplete",
    "MaterialDesignButtonAdition",
    "MaterialDesignButtonAditionVertical",
    "MaterialDesignButtonLink",
    "MaterialDesignButtonLinkVertical",
    "MaterialDesignButtonNavigation",
    "MaterialDesignButtonNavigationVertical",
    "MaterialDesignButtonState",
    "MaterialDesignButtonStateMulti",
    "MaterialDesignButtonStateMultiVertical",
    "MaterialDesignButtonStateVertical",
    "MaterialDesignButtonToggle",
    "MaterialDesignButtonToggleVertical",
    "MaterialDesignCalendar",
    "MaterialDesignCard",
    "MaterialDesignChartBar",
    "MaterialDesignChartJson",
    "MaterialDesignChartLineHistory",
    "MaterialDesignChartPie",
    "MaterialDesignCheckbox",
    "MaterialDesignColorScheme",
    "MaterialDesignGridViews",
    "MaterialDesignIcon",
    "MaterialDesignIconButtonAdition",
    "MaterialDesignIconButtonLink",
    "MaterialDesignIconButtonNavigation",
    "MaterialDesignIconButtonSlider",
    "MaterialDesignIconButtonState",
    "MaterialDesignIconButtonStateMulti",
    "MaterialDesignIconButtonToggle",
    "MaterialDesignIconList",
    "MaterialDesignInput",
    "MaterialDesignInstalledVersion",
    "MaterialDesignList",
    "MaterialDesignMasonryViews",
    "MaterialDesignProgress",
    "MaterialDesignProgressCircular",
    "MaterialDesignSelect",
    "MaterialDesignRoundSlider",
    "MaterialDesignSwitch",
    "MaterialDesignTable",
    "MaterialDesignTopAppBar",
    "MaterialDesignDialogView",
    "MaterialDesignDialogIFrame",
    "MaterialDesignSlider",
    "MaterialDesignValue",
    "MaterialDesignAdvancedViewInWidget",
    "MaterialDesignAdvancedViewInWidget8",
];
for (const component of portedComponents) {
    assert.ok(widgetRegistry.components.includes(component), `${component} must be registered in io-package.json`);
    assert.ok(vite.includes(`./${component}`), `${component} must be exposed by Vite`);
    assert.ok(fs.existsSync(path.join(root, "src-widgets-ts", "src", `${component}.tsx`)), `${component} source must exist`);
}
assert.strictEqual(widgetRegistry.components.length, portedComponents.length, "io-package.json must register exactly the ported VIS2 components");
assert.ok(fs.existsSync(path.join(root, "widgets", "vis2-materialdesign", "materialdesign-widgets-click-sound.mp3")), "VIS2 click sound must be packaged");

for (const file of walk(path.join(root, "admin"), (name) => name.endsWith(".json") && !name.endsWith("tsconfig.json"))) {
    JSON.parse(fs.readFileSync(file, "utf8"));
}

const i18nDir = path.join(root, "admin", "i18n");
const languageFiles = fs.readdirSync(i18nDir).filter((name) => name.endsWith(".json"));
assert.ok(languageFiles.includes("en.json") && languageFiles.includes("de.json") && languageFiles.includes("ru.json"), "widget translations need en, de and ru");
const englishKeys = Object.keys(readJson("admin/i18n/en.json")).sort();
for (const file of languageFiles) {
    const content = fs.readFileSync(path.join(i18nDir, file), "utf8");
    assert.ok(!content.includes("Ã"), `${file} must not contain mojibake`);
    assert.deepStrictEqual(Object.keys(JSON.parse(content)).sort(), englishKeys, `${file} must contain the same keys as en.json`);
}

console.log("Package checks passed");
