const { cpSync, existsSync, mkdirSync, rmSync } = require('node:fs');
const { execFileSync } = require('node:child_process');
const adapterName = require('./package.json').name.replace('iobroker.', '');

// npm ships as `npm.cmd` on Windows. Plain 'npm' doesn't resolve there (execFileSync doesn't do
// PATHEXT lookup like a shell would), and spawning 'npm.cmd' directly fails with EINVAL — Windows
// .cmd/.bat files are shell scripts, not native executables, and can only run through a shell.
// shell:true is therefore required here, not just stylistic; safe because every argv element below
// is a fixed literal we control, never interpolated user input.

const SRC_TS = 'src-widgets-ts/';
const srcTs = `${__dirname}/${SRC_TS}`;
const widgetTarget = `${__dirname}/widgets/${adapterName}`;
const staticSource = `${srcTs}static`;

function clean() {
    rmSync(`${srcTs}build`, { recursive: true, force: true });
    rmSync(widgetTarget, { recursive: true, force: true });
}

function copyAllFiles() {
    mkdirSync(widgetTarget, { recursive: true });
    cpSync(`${srcTs}build/customWidgets.js`, `${widgetTarget}/customWidgets.js`);
    if (existsSync(`${srcTs}build/customWidgets.ssr.js`)) {
        cpSync(`${srcTs}build/customWidgets.ssr.js`, `${widgetTarget}/customWidgets.ssr.js`);
    }
    if (existsSync(`${srcTs}build/mf-stats.json`)) {
        cpSync(`${srcTs}build/mf-stats.json`, `${widgetTarget}/mf-stats.json`);
    }
    if (existsSync(`${srcTs}build/assets`)) {
        cpSync(`${srcTs}build/assets`, `${widgetTarget}/assets`, { recursive: true });
    }
    if (existsSync(staticSource)) {
        cpSync(staticSource, widgetTarget, { recursive: true });
    }
    if (existsSync(`${__dirname}/admin/materialdesign-widgets-click-sound.mp3`)) {
        cpSync(
            `${__dirname}/admin/materialdesign-widgets-click-sound.mp3`,
            `${widgetTarget}/materialdesign-widgets-click-sound.mp3`,
        );
    }
}

clean();

// Regenerate the runtime `group_*` label subset from the admin i18n before building (keeps
// widgetUtils' group-header bridge in sync without dragging the full dictionary into the runtime).
require('./scripts/gen-group-labels.cjs').generate();

if (!existsSync(`${srcTs}/node_modules`)) {
    execFileSync('npm', ['install'], { cwd: srcTs, shell: true, stdio: 'inherit' });
}

execFileSync('npm', ['run', 'build'], { cwd: srcTs, shell: true, stdio: 'inherit' });
copyAllFiles();
execFileSync('npm', ['run', 'build:admin'], { cwd: __dirname, shell: true, stdio: 'inherit' });
