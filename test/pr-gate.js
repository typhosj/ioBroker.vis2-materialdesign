"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const pkg = readJson("package.json");
const io = readJson("io-package.json");
const objects = [...(io.instanceObjects || []), ...(io.objects || [])];

assert.strictEqual(pkg.name, `iobroker.${io.common.name}`, "package and io-package adapter names must match");
assert.strictEqual(pkg.version, io.common.version, "package and io-package versions must match");
assert.ok(io.common.authors?.length, "io-package common.authors must be set");
assert.ok(Object.keys(io.common.news || {}).length <= 7, "common.news may contain at most seven entries");
assert.ok(io.common.news?.[pkg.version], `common.news must contain an entry for current version ${pkg.version}`);

// vite builds from src-widgets-ts/ and resolves deps from its OWN node_modules;
// a version bumped only in one tree ships a stale bundle (chart.js v2/v4 incident).
// Compare INSTALLED versions (what vite bundles vs what root tests against).
const widgetPkg = readJson("src-widgets-ts/package.json");
const rootDeps = { ...pkg.devDependencies, ...pkg.dependencies };
const installedVersion = (base, dep) => {
    try {
        return readJson(path.join(base, "node_modules", dep, "package.json")).version;
    } catch {
        return null;
    }
};
for (const dep of Object.keys(widgetPkg.dependencies || {})) {
    if (!(dep in rootDeps)) continue;
    const widgetVersion = installedVersion("src-widgets-ts", dep);
    const rootVersion = installedVersion(".", dep);
    if (!widgetVersion || !rootVersion) continue;
    // ponytail: major-only comparison; patch/minor npm churn between the two lockfiles is noise,
    // tighten to full equality if a minor-version API drift ever ships a broken bundle.
    assert.strictEqual(widgetVersion.split(".")[0], rootVersion.split(".")[0], `${dep} installed major differs: src-widgets-ts has ${widgetVersion}, root has ${rootVersion} — bump BOTH package.json files and npm install in both`);
}

// 0.4.0 of this package ships one extensionless relative ESM import in
// dynamiccolor/color_spec_2025.js. A bundler resolves it, plain Node throws ERR_MODULE_NOT_FOUND —
// which breaks every node-side script and check here. The M3 scheme only needs the Hct/TonalPalette
// API, which 0.3.0 has. Before widening this range, require() the package under plain Node first.
assert.match(
    pkg.devDependencies["@material/material-color-utilities"],
    /^\^?0\.3\./,
    "@material/material-color-utilities must stay on 0.3.x — 0.4.0 is not loadable under plain Node",
);

for (const object of objects) {
    assert.ok(object._id, "object needs _id");
    assert.ok(object.type, `${object._id} needs type`);
    assert.ok(object.native, `${object._id} needs native`);
    if (object.type !== "state") continue;
    assert.ok(object.common, `${object._id} state needs common`);
    assert.ok(object.common.type, `${object._id} state needs common.type`);
    assert.ok(object.common.role && object.common.role !== "state", `${object._id} state needs a concrete role`);
    assert.strictEqual(typeof object.common.read, "boolean", `${object._id} state needs boolean common.read`);
    assert.strictEqual(typeof object.common.write, "boolean", `${object._id} state needs boolean common.write`);
    assert.ok(!objects.some((other) => other._id.startsWith(`${object._id}.`)), `${object._id} is a state and must be a tree leaf`);
}

for (const dir of ["src-widgets-ts/src", "src-admin/src"]) {
    const files = fs.readdirSync(path.join(root, dir), { recursive: true });
    for (const file of files) {
        if (!file.endsWith(".ts") && !file.endsWith(".tsx")) continue;
        const content = fs.readFileSync(path.join(root, dir, file), "utf8");
        assert.ok(!content.includes("system.adapter.vis-materialdesign"), `${path.join(dir, file)} must not read the legacy adapter object`);
    }
}

console.log("PR gate checks passed");
