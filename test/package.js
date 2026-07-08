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

for (const file of walk(path.join(root, "admin"), (name) => name.endsWith(".json") && !name.endsWith("tsconfig.json"))) {
    JSON.parse(fs.readFileSync(file, "utf8"));
}

console.log("Package checks passed");
