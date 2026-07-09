const { cpSync, existsSync, mkdirSync, rmSync } = require('node:fs');
const { execFileSync } = require('node:child_process');
const adapterName = require('./package.json').name.replace('iobroker.', '');

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

if (!existsSync(`${srcTs}/node_modules`)) {
    execFileSync('npm', ['install'], { cwd: srcTs, stdio: 'inherit' });
}

execFileSync('npm', ['run', 'build'], { cwd: srcTs, stdio: 'inherit' });
copyAllFiles();
