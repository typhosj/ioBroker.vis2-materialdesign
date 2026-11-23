import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { reactAlias, reactDir } from './paths';

function fakeRepo(withWidgetTree: boolean): string {
    const root = mkdtempSync(join(tmpdir(), 'gallery-paths-'));
    mkdirSync(join(root, 'node_modules/react'), { recursive: true });
    writeFileSync(join(root, 'node_modules/react/package.json'), '{}');
    if (withWidgetTree) {
        mkdirSync(join(root, 'src-widgets-ts/node_modules/react'), { recursive: true });
        writeFileSync(join(root, 'src-widgets-ts/node_modules/react/package.json'), '{}');
    }
    return root;
}

describe('reactDir', () => {
    it('uses the widget tree when it is installed, because the widget sources resolve React there', () => {
        const root = fakeRepo(true);
        expect(reactDir(root)).toBe(join(root, 'src-widgets-ts/node_modules'));
    });
    it('falls back to the root tree when only the root is installed (CI adapter-tests)', () => {
        const root = fakeRepo(false);
        expect(reactDir(root)).toBe(join(root, 'node_modules'));
    });
    it('aliases react, react-dom and their subpaths with forward slashes', () => {
        const root = fakeRepo(true);
        const [alias] = reactAlias(root);
        expect('react-dom/client'.replace(alias.find, alias.replacement)).toBe(`${join(root, 'src-widgets-ts/node_modules').replace(/\\/g, '/')}/react-dom/client`);
        expect(alias.find.test('react-is')).toBe(false);
    });
});