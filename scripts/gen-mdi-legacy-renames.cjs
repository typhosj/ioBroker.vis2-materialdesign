'use strict';
// Icon names that existed in MDI 6.7.96 (shipped by Scrounger's adapter) but not in the MDI version
// we ship, and their successor where MDI lists the old name as an alias. Run after an @mdi/font bump:
//   node scripts/gen-mdi-legacy-renames.cjs
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const pkg = require('../package.json');
const version = (pkg.devDependencies['@mdi/font'] ?? pkg.dependencies['@mdi/font']).replace(/^[^\d]*/, '');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mdi-'));
const unpack = (spec, n) => {
    const tgz = execSync(`npm pack ${spec} --silent`, { cwd: dir }).toString().trim().split('\n').pop();
    // Relative paths: GNU tar reads "C:\..." as a remote host.
    fs.mkdirSync(path.join(dir, `x${n}`));
    execSync(`tar -xzf "${tgz}" -C x${n}`, { cwd: dir });
    return path.join(dir, `x${n}`, 'package');
};
// Class names, not meta.json: modifiers such as mdi-spin or mdi-rotate-90 are classes but no icons.
const classNames = root => {
    const css = fs.readFileSync(path.join(root, 'css', 'materialdesignicons.css'), 'utf8');
    return new Set([...css.matchAll(/\.mdi-([a-z0-9-]+)::?before/g)].map(m => m[1]));
};
const oldNames = classNames(unpack('@mdi/font@6.7.96', 1));
const current = classNames(unpack(`@mdi/font@${version}`, 3));
const meta = JSON.parse(fs.readFileSync(path.join(unpack(`@mdi/svg@${version}`, 2), 'meta.json'), 'utf8'));
const renamed = {};
const removed = [];
for (const name of [...oldNames].sort()) {
    if (current.has(name)) {
        continue;
    }
    const successor = meta.find(icon => (icon.aliases ?? []).includes(name));
    if (successor) {
        renamed[name] = successor.name;
    } else {
        removed.push(name);
    }
}
fs.writeFileSync(
    path.join(__dirname, '..', 'src-admin', 'src', 'mdiLegacyRenames.json'),
    `${JSON.stringify({ renamed, removed }, null, 4)}\n`,
);
fs.rmSync(dir, { recursive: true, force: true });
console.log(`renamed ${Object.keys(renamed).length}, removed ${removed.length}`);
