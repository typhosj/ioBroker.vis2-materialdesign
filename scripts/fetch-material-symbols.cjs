// Downloads the self-hosted Material Symbols Outlined face and its ligature-name list.
//
// Run by hand on a version bump, NOT by tasks.js: both outputs are committed, and a widget build
// must never depend on reaching fonts.google.com (ioBroker hosts are frequently offline, and the
// runtime never contacts the CDN either — the font is served from the adapter itself).
//
//     node scripts/fetch-material-symbols.cjs
//
// The CSS API URL pins every axis to a single value (opsz 24, wght 400, FILL 0, GRAD 0), which is
// what makes Google return a STATIC instance (~320 kB, no fvar) instead of the variable face
// (~488 kB). Changing the URL changes the size by more than 50%.
const { writeFileSync, mkdirSync } = require('node:fs');
const { join } = require('node:path');

const ROOT = join(__dirname, '..');
const CSS_URL = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0';
const METADATA_URL = 'https://fonts.google.com/metadata/icons?incomplete=1&key=material_symbols';
const FAMILY = 'Material Symbols Outlined';
// Google serves the woff2 URL only to clients it believes support woff2; a bare fetch UA gets ttf.
const UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36';

async function get(url) {
    const response = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!response.ok) {
        throw new Error(`${url} → HTTP ${response.status}`);
    }
    return response;
}

async function fetchFont() {
    const css = await (await get(CSS_URL)).text();
    const url = css.match(/url\((https:\/\/[^)]+\.woff2)\)/)?.[1];
    if (!url) {
        throw new Error(`no woff2 URL in the CSS API response:\n${css}`);
    }
    const font = Buffer.from(await (await get(url)).arrayBuffer());
    mkdirSync(join(ROOT, 'src-widgets-ts/static/img'), { recursive: true });
    writeFileSync(join(ROOT, 'src-widgets-ts/static/img/material-symbols-outlined.woff2'), font);
    return { bytes: font.length, url };
}

async function fetchNames() {
    // The metadata endpoint answers with an XSSI guard line before the JSON body.
    const body = (await (await get(METADATA_URL)).text()).replace(/^\)]}'\n/, '');
    const names = JSON.parse(body)
        .icons.filter(icon => !(icon.unsupported_families || []).includes(FAMILY))
        .map(icon => icon.name)
        .sort();
    if (names.length < 3000) {
        throw new Error(`only ${names.length} names for ${FAMILY} — the metadata format changed`);
    }
    mkdirSync(join(ROOT, 'src-widgets-ts/src/generated'), { recursive: true });
    writeFileSync(join(ROOT, 'src-widgets-ts/src/generated/materialSymbolsNames.json'), `${JSON.stringify(names)}\n`);
    return names.length;
}

async function main() {
    const font = await fetchFont();
    const count = await fetchNames();
    console.log(`font: ${font.bytes} B from ${font.url}`);
    console.log(`names: ${count}`);
}

main().catch(error => {
    console.error(error.message);
    process.exit(1);
});
