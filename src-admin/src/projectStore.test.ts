import { describe, expect, it } from 'vitest';
import type { AdminConnection } from '@iobroker/adapter-react-v5';

import { migrateStoredProject, restoreStoredProject, scanProjects, type FileSocket } from './projectStore';

// Type check: FileSocket must be assignable from AdminConnection
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _checkAssignability: (s: AdminConnection) => FileSocket = s => s;

const NS = 'vis2-materialdesign.0';

// `unreadable` files exist but fail to read, the way a permission or connection error does.
// `shapes` overrides what readFile hands back for a file, for content in a shape nobody expects.
function fakeSocket(files: Record<string, string>, unreadable: string[] = [], shapes: Record<string, unknown> = {}): FileSocket & { files: Record<string, string> } {
    return {
        files,
        readDir: (_ns, path) => Promise.resolve([...new Set(Object.keys(files).filter(f => f.startsWith(path ? `${path}/` : '')).map(f => f.slice(path ? path.length + 1 : 0).split('/')[0]))].map(file => ({ file, isDir: !file.includes('.') }))),
        readFile: (_ns, file) => {
            if (unreadable.includes(file)) return Promise.reject(new Error('read failed'));
            if (!(file in files)) return Promise.reject(new Error('Not exists'));
            if (shapes[file]) return Promise.resolve({ file: shapes[file] as string });
            // Like the admin socket: text for a known text type, a serialized Buffer for any other
            // extension — the backups are served as application/octet-stream.
            if (/\.(json|css)$/.test(file)) return Promise.resolve({ file: files[file] });
            return Promise.resolve({ file: { type: 'Buffer', data: [...Buffer.from(files[file], 'utf8')] } as unknown as string });
        },
        // Like the admin socket: a string is taken as base64, an ArrayBuffer as the file's bytes.
        writeFile64: (_ns, file, data: ArrayBuffer | string) => {
            files[file] = typeof data === 'string' ? Buffer.from(data, 'base64').toString('utf8') : new TextDecoder().decode(data);
            return Promise.resolve();
        },
        fileExists: (_ns, file) => Promise.resolve(file in files),
    };
}

const OLD_VIEWS = JSON.stringify({ main: { widgets: { w1: { tpl: 'tplVis-materialdesign-Chart-Bar', data: { dataCount: 1, oid0: 'vis-materialdesign.0.x' } } } } }, null, 2);

describe('scanProjects', () => {
    it('lists every project with its count of old widgets', async () => {
        const socket = fakeSocket({ 'main/vis-views.json': OLD_VIEWS, 'empty/vis-views.json': '{}', 'main/vis-user.css': '' });
        expect(await scanProjects(socket)).toEqual([
            { name: 'empty', legacyWidgets: 0, hasBackup: false },
            { name: 'main', legacyWidgets: 1, hasBackup: false },
        ]);
    });

    it('skips a project whose views file is missing or not JSON', async () => {
        const socket = fakeSocket({ 'broken/vis-views.json': '{nope', 'nofile/vis-user.css': '' });
        expect(await scanProjects(socket)).toEqual([]);
    });

    it('reports a views file that exists but cannot be read instead of hiding the project', async () => {
        const socket = fakeSocket({ 'main/vis-views.json': OLD_VIEWS }, ['main/vis-views.json']);
        await expect(scanProjects(socket)).rejects.toThrow('read failed');
    });
});

describe('migrateStoredProject', () => {
    it('backs up the original, then writes the converted project in vis-2 format', async () => {
        const socket = fakeSocket({ 'main/vis-views.json': OLD_VIEWS });
        const report = await migrateStoredProject(socket, 'main', NS);
        expect(report.widgets).toBe(1);
        expect(socket.files['main/vis-views.json.mdw-backup']).toBe(OLD_VIEWS);
        const written = socket.files['main/vis-views.json'];
        expect(written).toBe(JSON.stringify(JSON.parse(written), null, 2));
        const w1 = JSON.parse(written).main.widgets.w1;
        expect(w1).toMatchObject({ tpl: 'tplVis2-materialdesign-Chart-Bar', widgetSet: 'vis2-materialdesign', data: { dataCount: 2, oid0: 'vis2-materialdesign.0.x' } });
        expect(w1.data.__mdwThemeDark).toBe('vis2-materialdesign.0.colors.darkTheme');
    });

    it('keeps non-ASCII text byte-exact in the project, its backup and the restored file', async () => {
        const original = JSON.stringify({ main: { widgets: {
            w1: { tpl: 'tplVis-materialdesign-List', data: { countListItems: 0, label0: 'Größe ✓ 🌙', oid0: 'vis-materialdesign.0.x' } },
            w2: { tpl: 'tplHtml', data: { html: '' } },
        } } }, null, 2);
        const socket = fakeSocket({ 'main/vis-views.json': original });
        await migrateStoredProject(socket, 'main', NS);
        expect(socket.files['main/vis-views.json.mdw-backup']).toBe(original);
        const written = JSON.parse(socket.files['main/vis-views.json']);
        expect(written.main.widgets.w1.data.label0).toBe('Größe ✓ 🌙');
        expect(written.main.widgets.w2.data.html).toBe('');
        await restoreStoredProject(socket, 'main');
        expect(socket.files['main/vis-views.json']).toBe(original);
    });

    it('rejects and writes nothing when an existing views file cannot be read', async () => {
        const socket = fakeSocket({ 'main/vis-views.json': OLD_VIEWS }, ['main/vis-views.json']);
        await expect(migrateStoredProject(socket, 'main', NS)).rejects.toThrow('read failed');
        expect(Object.keys(socket.files)).toEqual(['main/vis-views.json']);
    });

    it('rejects and writes nothing when an existing vis-user.css cannot be read', async () => {
        const socket = fakeSocket({ 'main/vis-views.json': OLD_VIEWS, 'main/vis-user.css': '.x{}' }, ['main/vis-user.css']);
        await expect(migrateStoredProject(socket, 'main', NS)).rejects.toThrow('read failed');
        expect(socket.files).toEqual({ 'main/vis-views.json': OLD_VIEWS, 'main/vis-user.css': '.x{}' });
    });

    it('reports a missing views file as not found', async () => {
        await expect(migrateStoredProject(fakeSocket({}), 'main', NS)).rejects.toThrow('main/vis-views.json not found');
    });

    it('never overwrites an existing backup, which holds the pristine original', async () => {
        const socket = fakeSocket({ 'main/vis-views.json': OLD_VIEWS, 'main/vis-views.json.mdw-backup': 'ORIGINAL' });
        await migrateStoredProject(socket, 'main', NS);
        expect(socket.files['main/vis-views.json.mdw-backup']).toBe('ORIGINAL');
    });

    it('rewrites the namespace in vis-user.css, backs it up and reports legacy selectors', async () => {
        const css = '.mdc-card{color:red} /* {vis-materialdesign.0.colors.light.x} */';
        const socket = fakeSocket({ 'main/vis-views.json': OLD_VIEWS, 'main/vis-user.css': css });
        const report = await migrateStoredProject(socket, 'main', NS);
        expect(socket.files['main/vis-user.css']).toBe('.mdc-card{color:red} /* {vis2-materialdesign.0.colors.light.x} */');
        expect(socket.files['main/vis-user.css.mdw-backup']).toBe(css);
        expect(report.cssWarnings).toEqual(['.mdc-card']);
    });

    it('writes nothing when the project needs no change', async () => {
        const clean = JSON.stringify({ main: { widgets: { w: { tpl: 'tplHtml', data: {} } } } }, null, 2);
        const socket = fakeSocket({ 'main/vis-views.json': clean, 'main/vis-user.css': '.x{}' });
        await migrateStoredProject(socket, 'main', NS);
        expect(Object.keys(socket.files).sort()).toEqual(['main/vis-user.css', 'main/vis-views.json']);
    });

    it('throws and writes nothing when the views file is not JSON', async () => {
        const socket = fakeSocket({ 'main/vis-views.json': '{nope' });
        await expect(migrateStoredProject(socket, 'main', NS)).rejects.toThrow();
        expect(Object.keys(socket.files)).toEqual(['main/vis-views.json']);
    });
});

describe('restoreStoredProject', () => {
    it('puts both backups back', async () => {
        const css = '.mdc-card{color:red} /* {vis-materialdesign.0.colors.light.x} */';
        const socket = fakeSocket({ 'main/vis-views.json': OLD_VIEWS, 'main/vis-user.css': css });
        await migrateStoredProject(socket, 'main', NS);
        expect(await restoreStoredProject(socket, 'main')).toBe(true);
        expect(socket.files['main/vis-views.json']).toBe(OLD_VIEWS);
        expect(socket.files['main/vis-user.css']).toBe(css);
    });

    it('rejects and restores nothing when a backup exists but cannot be read', async () => {
        const css = '.mdc-card{color:red} /* {vis-materialdesign.0.colors.light.x} */';
        const files = { 'main/vis-views.json': OLD_VIEWS, 'main/vis-user.css': css };
        await migrateStoredProject(fakeSocket(files), 'main', NS);
        const migrated = { ...files };
        const socket = fakeSocket(files, ['main/vis-views.json.mdw-backup']);
        await expect(restoreStoredProject(socket, 'main')).rejects.toThrow('read failed');
        expect(socket.files).toEqual(migrated);
    });

    it('rejects and restores nothing when a backup comes back in a shape that is not text or bytes', async () => {
        const files = { 'main/vis-views.json': OLD_VIEWS };
        await migrateStoredProject(fakeSocket(files), 'main', NS);
        const migrated = { ...files };
        const socket = fakeSocket(files, [], { 'main/vis-views.json.mdw-backup': { unexpected: true } });
        await expect(restoreStoredProject(socket, 'main')).rejects.toThrow();
        expect(socket.files).toEqual(migrated);
    });

    it('reports false when there is no backup', async () => {
        expect(await restoreStoredProject(fakeSocket({ 'main/vis-views.json': '{}' }), 'main')).toBe(false);
    });

    it('restores only the views file when only views backup exists', async () => {
        const socket = fakeSocket({ 'main/vis-views.json': OLD_VIEWS, 'main/vis-user.css': '.x{}' });
        await migrateStoredProject(socket, 'main', NS);
        const css = socket.files['main/vis-user.css'];
        expect(await restoreStoredProject(socket, 'main')).toBe(true);
        expect(socket.files['main/vis-views.json']).toBe(OLD_VIEWS);
        expect(socket.files['main/vis-user.css']).toBe(css);
    });

    it('restores only the CSS file when only CSS backup exists', async () => {
        const css = '.mdc-card{color:red} /* {vis-materialdesign.0.colors.light.x} */';
        const socket = fakeSocket({ 'main/vis-views.json': OLD_VIEWS, 'main/vis-user.css': css });
        await migrateStoredProject(socket, 'main', NS);
        const views = socket.files['main/vis-views.json'];
        delete socket.files['main/vis-views.json.mdw-backup'];
        expect(await restoreStoredProject(socket, 'main')).toBe(true);
        expect(socket.files['main/vis-views.json']).toBe(views);
        expect(socket.files['main/vis-user.css']).toBe(css);
    });

    it('allows recovery when migration fails mid-way', async () => {
        const css = '.mdc-card{color:red} /* {vis-materialdesign.0.colors.light.x} */';
        const socket = fakeSocket({ 'main/vis-views.json': OLD_VIEWS, 'main/vis-user.css': css });
        const writeFile64 = socket.writeFile64;
        let cssWriteAttempted = false;
        socket.writeFile64 = async (ns, file, data) => {
            if (file === 'main/vis-user.css' && !cssWriteAttempted) {
                cssWriteAttempted = true;
                throw new Error('CSS write failed');
            }
            return writeFile64.call(socket, ns, file, data);
        };
        await expect(migrateStoredProject(socket, 'main', NS)).rejects.toThrow('CSS write failed');
        expect(socket.files['main/vis-views.json.mdw-backup']).toBe(OLD_VIEWS);
        expect(socket.files['main/vis-views.json']).not.toBe(OLD_VIEWS);
        expect(socket.files['main/vis-user.css']).toBe(css);
        await restoreStoredProject(socket, 'main');
        expect(socket.files['main/vis-views.json']).toBe(OLD_VIEWS);
    });

    it('never overwrites an existing CSS backup', async () => {
        const css = '.mdc-card{color:red} /* {vis-materialdesign.0.colors.light.x} */';
        const socket = fakeSocket({ 'main/vis-views.json': OLD_VIEWS, 'main/vis-user.css': css, 'main/vis-user.css.mdw-backup': 'ORIGINAL_CSS' });
        await migrateStoredProject(socket, 'main', NS);
        expect(socket.files['main/vis-user.css.mdw-backup']).toBe('ORIGINAL_CSS');
    });

    it('writes nothing when project is already migrated', async () => {
        const NS2 = 'vis2-materialdesign.0';
        const migratedViews = JSON.stringify({
            main: {
                widgets: {
                    w: { tpl: 'tplVis2-materialdesign-Chart-Bar', widgetSet: 'vis2-materialdesign', data: { dataCount: 2, oid0: 'vis2-materialdesign.0.x' } },
                },
            },
        }, null, 2);
        const socket = fakeSocket({ 'main/vis-views.json': migratedViews, 'main/vis-user.css': '.x{}' });
        const beforeFileCount = Object.keys(socket.files).length;
        await migrateStoredProject(socket, 'main', NS2);
        expect(Object.keys(socket.files).length).toBe(beforeFileCount);
    });
});
