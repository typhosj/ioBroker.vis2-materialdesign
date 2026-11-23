import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { importDocVariants } from './docVariants.ts';
import { repoRoot } from './paths.ts';

const source = process.argv[2];
if (!source) {
    console.error('usage: node --experimental-strip-types gallery/build/import-doc-variants.ts <mdw-parity-views.doc.json>');
    process.exit(2);
}
const project = JSON.parse(readFileSync(source, 'utf8'));
const index = JSON.parse(readFileSync(join(repoRoot, 'gallery/src/generated/widgetIndex.json'), 'utf8'));
const oidMap = JSON.parse(readFileSync(join(repoRoot, 'gallery/build/oidMap.json'), 'utf8'));
const rules = JSON.parse(readFileSync(join(repoRoot, 'gallery/build/idRules.json'), 'utf8'));
const textMap = JSON.parse(readFileSync(join(repoRoot, 'gallery/build/textMap.json'), 'utf8'));
const { variants, unmapped, review } = importDocVariants(project, index, oidMap, rules, textMap);
if (unmapped.length) {
    console.error(`Add these to gallery/build/oidMap.json (demo id or neutral replacement):\n${unmapped.join('\n')}`);
    process.exit(1);
}
if (review.length) console.log(`Review (add German to gallery/build/textMap.json):\n${review.join('\n')}`);
writeFileSync(join(repoRoot, 'gallery/src/catalog/variants.generated.json'), `${JSON.stringify(variants, null, 2)}\n`);
console.log(`${variants.length} variants written`);
