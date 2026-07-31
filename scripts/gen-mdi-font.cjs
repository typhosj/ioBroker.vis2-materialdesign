'use strict';
// Regenerates the vendored Material Design Icons stylesheet and webfont from @mdi/font.
//
// Vendored and not imported straight from node_modules for two reasons: the upstream @font-face
// references eot/woff/ttf next to woff2 (~2.9 MB of dead weight for a chrome89 target), and the
// font has to sit under widgets/vis2-materialdesign/img/ where the vis-2 web server serves it.
//
// Run after every @mdi/font bump:  node scripts/gen-mdi-font.cjs
// It prints the icon names that the bump added and removed — a removed name is a broken icon in
// any project that saved it, so the removal list is the thing to read.
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const pkg = require(path.join(root, 'node_modules/@mdi/font/package.json'));
const upstream = fs.readFileSync(path.join(root, 'node_modules/@mdi/font/css/materialdesignicons.min.css'), 'utf8');

const CSS_TARGET = path.join(root, 'src-widgets-ts/src/mdi-font.css');
const FONT_TARGET = path.join(root, 'src-widgets-ts/static/img/materialdesignicons-webfont.woff2');

const GLYPH = /\.mdi-[a-z0-9-]+::before\{content:"\\[0-9A-Fa-f]+"\}/g;
const BASE = /\.mdi:before,\s*\.mdi-set\{[^}]*\}/;

const glyphs = upstream.match(GLYPH);
if (!glyphs || glyphs.length < 1000) throw new Error(`only ${glyphs ? glyphs.length : 0} glyph rules found — upstream format changed`);
const base = upstream.match(BASE);
if (!base) throw new Error('base .mdi rule not found — upstream format changed');

// Everything the picker offers comes from these class names at runtime (IconFilePicker.tsx parses
// this stylesheet), so the glyph rules are the contract, not just styling.
const names = glyphs.map(rule => rule.slice(5, rule.indexOf('::')));

const previous = fs.existsSync(CSS_TARGET) ? fs.readFileSync(CSS_TARGET, 'utf8') : '';
const before = new Set((previous.match(GLYPH) || []).map(rule => rule.slice(5, rule.indexOf('::'))));

const fontFace = '@font-face{font-family:"Material Design Icons";src:url("../img/materialdesignicons-webfont.woff2") format("woff2");font-weight:normal;font-style:normal}';
const header = `/*
 * Material Design Icons glyph classes from @mdi/font ${pkg.version}, @font-face trimmed to woff2
 * only (the eot/woff/ttf the upstream min.css references are ~2.9MB of dead weight for a chrome89
 * target). Generated — do not edit by hand: run \`node scripts/gen-mdi-font.cjs\` after a bump.
 */
`;

fs.writeFileSync(CSS_TARGET, `${header}${fontFace}${base[0]}${glyphs.join('')}\n`, 'utf8');
fs.copyFileSync(path.join(root, 'node_modules/@mdi/font/fonts/materialdesignicons-webfont.woff2'), FONT_TARGET);

const added = names.filter(name => before.size && !before.has(name));
const removed = [...before].filter(name => !names.includes(name));
console.log(`@mdi/font ${pkg.version}: ${names.length} icons`);
if (before.size) console.log(`added ${added.length}, removed ${removed.length}`);
if (removed.length) console.log(`REMOVED (breaks any saved project using them):\n  ${removed.join('\n  ')}`);
