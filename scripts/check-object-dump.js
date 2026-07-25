"use strict";

// Release gate: validate an exported object dump exactly like the
// ioBroker.repositories PR bot does (checkObjectStructure). The bot fails the
// "objects" label on ANY error OR warning, so this script does too.
// Usage: npm run pr:objects -- <path-to-dump.json>

const { execSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const dumpPath = process.argv[2];
if (!dumpPath || !fs.existsSync(dumpPath)) {
    console.error("Usage: npm run pr:objects -- <object-dump.json>");
    console.error("");
    console.error("Dump requirements (same as the repositories PR bot):");
    console.error("  - exported from a live instance running the EXACT version the PR references");
    console.error("  - exported AFTER a full admin config Save completed (never mid-sync)");
    console.error("  - full subtree of vis2-materialdesign.0 (admin objects tab -> export)");
    process.exit(1);
}

// The PR bot always runs the latest repochecker; cache it max 7 days so local
// results match the bot. Delete the cache dir to force a refresh.
const cacheDir = path.join(os.tmpdir(), "iobroker-repochecker-gate");
const libPath = path.join(cacheDir, "node_modules", "@iobroker", "repochecker", "lib", "objectStructure.js");
const stale = !fs.existsSync(libPath) || Date.now() - fs.statSync(libPath).mtimeMs > 7 * 24 * 3600 * 1000;
if (stale) {
    fs.mkdirSync(cacheDir, { recursive: true });
    console.log("Installing @iobroker/repochecker@latest into gate cache ...");
    execSync("npm install @iobroker/repochecker@latest --no-save --no-audit --no-fund --loglevel=error", {
        cwd: cacheDir,
        stdio: "inherit",
    });
}

const { checkObjectStructure } = require(libPath);
const dump = JSON.parse(fs.readFileSync(dumpPath, "utf8"));
const result = checkObjectStructure(dump, "vis2-materialdesign");

console.log(`Checked ${result.objectCount} objects (adapter: ${result.adapter})`);
for (const e of result.errors) console.error(`ERROR   ${e.code}: ${e.message}`);
for (const w of result.warnings) console.error(`WARNING ${w.code}: ${w.message}`);

if (result.errors.length || result.warnings.length) {
    console.error(`\nFAIL: ${result.errors.length} error(s), ${result.warnings.length} warning(s).`);
    console.error("The PR bot fails on warnings too - fix ALL findings before the repositories PR.");
    process.exit(1);
}
console.log("PASS: no errors or warnings - dump would be green in the repositories PR.");
