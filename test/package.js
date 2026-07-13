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

const sentry = io.instanceObjects.find((obj) => obj._id === "sentry");
assert.ok(sentry, "sentry state must exist");
assert.strictEqual(sentry.common.def, false);

const widgetRegistry = io.common.visWidgets.vis2MaterialDesignWidgets;
assert.ok(widgetRegistry, "VIS2 widget registry must exist");
const vite = fs.readFileSync(path.join(root, "src-widgets-ts", "vite.config.ts"), "utf8");
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

const legacyTemplates = fs.readFileSync(path.join(root, "widgets", "materialdesign.html"), "utf8").match(/id="tplVis-materialdesign-[^"]+/g) || [];
assert.ok(legacyTemplates.length >= 40, "legacy widget templates must remain available for parity comparison");
const legacyCoverage = {
    Alerts: "MaterialDesignAlerts",
    Autocomplete: "MaterialDesignAutocomplete",
    "Button-Adition": "MaterialDesignButtonAdition",
    "Button-Adition-vertical": "MaterialDesignButtonAditionVertical",
    "Button-Link": "MaterialDesignButtonLink",
    "Button-Link-vertical": "MaterialDesignButtonLinkVertical",
    "Button-Navigation": "MaterialDesignButtonNavigation",
    "Button-Navigation-vertical": "MaterialDesignButtonNavigationVertical",
    "Button-State": "MaterialDesignButtonState",
    "Button-State-Multi": "MaterialDesignButtonStateMulti",
    "Button-State-Multi-vertical": "MaterialDesignButtonStateMultiVertical",
    "Button-State-vertical": "MaterialDesignButtonStateVertical",
    "Button-Toggle": "MaterialDesignButtonToggle",
    "Button-Toggle-vertical": "MaterialDesignButtonToggleVertical",
    Calendar: "MaterialDesignCalendar",
    Card: "MaterialDesignCard",
    "Chart-Bar": "MaterialDesignChartBar",
    "Chart-JSON": "MaterialDesignChartJson",
    "Chart-Line-History": "MaterialDesignChartLineHistory",
    "Chart-Pie": "MaterialDesignChartPie",
    CheckBox: "MaterialDesignCheckbox",
    "ColorScheme-Preview": "MaterialDesignColorScheme",
    "Grid-Views": "MaterialDesignGridViews",
    Icon: "MaterialDesignIcon",
    "Icon-Button-Adition": "MaterialDesignIconButtonAdition",
    "Icon-Button-Link": "MaterialDesignIconButtonLink",
    "Icon-Button-Navigation": "MaterialDesignIconButtonNavigation",
    "Icon-Button-Slider": "MaterialDesignIconButtonSlider",
    "Icon-Button-State": "MaterialDesignIconButtonState",
    "Icon-Button-State-Multi": "MaterialDesignIconButtonStateMulti",
    "Icon-Button-Toggle": "MaterialDesignIconButtonToggle",
    "Icon-List": "MaterialDesignIconList",
    Input: "MaterialDesignInput",
    "Installed-Version": "MaterialDesignInstalledVersion",
    List: "MaterialDesignList",
    "Masonry-Views": "MaterialDesignMasonryViews",
    Progress: "MaterialDesignProgress",
    "Progress-Circular": "MaterialDesignProgressCircular",
    Select: "MaterialDesignSelect",
    "Slider-Round": "MaterialDesignRoundSlider",
    Switch: "MaterialDesignSwitch",
    Table: "MaterialDesignTable",
    "TopAppBar-Navigation": "MaterialDesignTopAppBar",
    "Vuetify-Dialog-View": "MaterialDesignDialogView",
    "Vuetify-Dialog-iFrame": "MaterialDesignDialogIFrame",
    "Vuetify-Slider": "MaterialDesignSlider",
    value: "MaterialDesignValue",
    "view-in-widget": "MaterialDesignAdvancedViewInWidget",
    "view-in-widget8": "MaterialDesignAdvancedViewInWidget8",
};
for (const [template, component] of Object.entries(legacyCoverage)) {
    assert.ok(legacyTemplates.includes(`id="tplVis-materialdesign-${template}`), `${template} legacy template must exist`);
    assert.ok(widgetRegistry.components.includes(component), `${template} must have a registered VIS2 counterpart`);
}
assert.strictEqual(Object.keys(legacyCoverage).length, legacyTemplates.length, "every legacy Material Design template must have a VIS2 counterpart");
assert.ok(fs.existsSync(path.join(root, "widgets", "vis2-materialdesign", "materialdesign-widgets-click-sound.mp3")), "VIS2 click sound must be packaged");

for (const file of walk(path.join(root, "admin"), (name) => name.endsWith(".json") && !name.endsWith("tsconfig.json"))) {
    JSON.parse(fs.readFileSync(file, "utf8"));
}

console.log("Package checks passed");
