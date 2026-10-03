import { countLegacyWidgets, legacyCssWarnings, migrateProject, rewriteNamespace, type MigrationReport, type Project } from './projectMigration';

export type FileSocket = {
    readDir(ns: string, path: string): Promise<Array<{ file: string; isDir: boolean }>>;
    readFile(ns: string, file: string): Promise<{ file: unknown } | string>;
    // Bytes only: the admin socket base64-decodes a string, which turns plain JSON into garbage.
    writeFile64(ns: string, file: string, data: ArrayBuffer): Promise<void>;
    fileExists(ns: string, file: string): Promise<boolean>;
    deleteFile(ns: string, file: string): Promise<void>;
};
export type ProjectScan = { name: string; legacyWidgets: number; hasBackup: boolean };

const STORAGE = 'vis-2.0';
const BACKUP = '.mdw-backup';
const views = (name: string): string => `${name}/vis-views.json`;
const css = (name: string): string => `${name}/vis-user.css`;

// null only for a file that does not exist; a file that exists but cannot be read throws, or a
// half-done restore or migration would look complete.
async function readText(socket: FileSocket, file: string): Promise<string | null> {
    if (!(await socket.fileExists(STORAGE, file))) return null;
    const result = await socket.readFile(STORAGE, file);
    return fileText(typeof result === 'string' ? result : result.file);
}

// The admin serves an unknown extension (our backups) as octet-stream, and the content then
// arrives as a serialized Buffer; taken as text it was written back as "[object Object]".
function fileText(content: unknown): string {
    if (typeof content === 'string') return content;
    if (content instanceof ArrayBuffer || ArrayBuffer.isView(content)) return new TextDecoder().decode(content);
    const bytes = content && typeof content === 'object' ? (content as { data?: unknown }).data : undefined;
    if (Array.isArray(bytes)) return new TextDecoder().decode(Uint8Array.from(bytes as number[]));
    throw new Error('file content is neither text nor bytes');
}

function writeText(socket: FileSocket, file: string, text: string): Promise<void> {
    return socket.writeFile64(STORAGE, file, new TextEncoder().encode(text).buffer);
}

async function writeWithBackup(socket: FileSocket, file: string, original: string, next: string): Promise<void> {
    if (!(await socket.fileExists(STORAGE, file + BACKUP))) await writeText(socket, file + BACKUP, original);
    await writeText(socket, file, next);
}

export async function scanProjects(socket: FileSocket): Promise<ProjectScan[]> {
    const result: ProjectScan[] = [];
    for (const entry of await socket.readDir(STORAGE, '')) {
        if (!entry.isDir) continue;
        const text = await readText(socket, views(entry.file));
        if (text === null) continue;
        try {
            result.push({ name: entry.file, legacyWidgets: countLegacyWidgets(JSON.parse(text) as Project), hasBackup: await socket.fileExists(STORAGE, views(entry.file) + BACKUP) });
        } catch {
            // not a vis-2 project
        }
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
}

export async function migrateStoredProject(socket: FileSocket, name: string, namespace: string): Promise<MigrationReport & { cssWarnings: string[] }> {
    const original = await readText(socket, views(name));
    if (original === null) throw new Error(`${views(name)} not found`);
    const style = await readText(socket, css(name));
    const { project, report } = migrateProject(JSON.parse(original) as Project, namespace);
    const next = JSON.stringify(project, null, 2);
    if (next !== JSON.stringify(JSON.parse(original), null, 2)) await writeWithBackup(socket, views(name), original, next);
    if (style !== null) {
        const nextStyle = rewriteNamespace(style, namespace);
        if (nextStyle !== style) await writeWithBackup(socket, css(name), style, nextStyle);
    }
    return { ...report, cssWarnings: style ? legacyCssWarnings(style) : [] };
}

export async function restoreStoredProject(socket: FileSocket, name: string): Promise<boolean> {
    const files = [views(name), css(name)];
    const backups = await Promise.all(files.map(file => readText(socket, file + BACKUP)));
    for (const [index, backup] of backups.entries()) {
        if (backup !== null) await writeText(socket, files[index], backup);
    }
    // Only once every file is back: a failed write must leave all backups for the next attempt.
    for (const [index, backup] of backups.entries()) {
        if (backup !== null) await socket.deleteFile(STORAGE, files[index] + BACKUP);
    }
    return backups.some(backup => backup !== null);
}
