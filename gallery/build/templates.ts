import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { repoRoot } from './paths';

// Content views come first: the main view embeds them by name, so they are imported before it.
export const TEMPLATE_VIEWS = ['dashboard-tablet-home', 'dashboard-tablet-lights', 'dashboard-tablet-climate', 'dashboard-tablet-energy', 'dashboard-tablet', 'dashboard-phone'];

export function demoObjects(scenario: { objects: Record<string, { type: string; common: Record<string, unknown> }> }): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [id, object] of Object.entries(scenario.objects)) {
        const parts = id.split('.');
        // 0_userdata.0 exists on every install, so the first created level is the third segment.
        for (let i = 3; i < parts.length; i++) {
            const parent = parts.slice(0, i).join('.');
            out[parent] ||= { _id: parent, type: i === 3 ? 'folder' : 'channel', common: { name: parts[i - 1] }, native: {} };
        }
        out[id] = { _id: id, type: object.type, common: object.common, native: {} };
    }
    return out;
}

export function viewTemplate(view: { settings?: Record<string, unknown>; widgets: Record<string, unknown> }, name: string): Record<string, unknown> {
    const widgets: Record<string, unknown> = {};
    Object.values(view.widgets).forEach((widget, index) => {
        const { data = {}, ...rest } = widget as { data?: Record<string, unknown> };
        const { designStyle, ...kept } = data;
        widgets[`w${String(index + 1).padStart(6, '0')}`] = { ...rest, data: designStyle === 'default' ? kept : data, widgetSet: 'vis2-materialdesign' };
    });
    return { settings: view.settings ?? { style: {} }, widgets, activeWidgets: [], name };
}

export const templateNames = (): string[] => [...TEMPLATE_VIEWS, 'demo-objects'];

export function templateFiles(): Record<string, string> {
    const read = (path: string): never => JSON.parse(readFileSync(join(repoRoot, path), 'utf8')) as never;
    const files: Record<string, string> = {
        'templates/demo-objects.json': JSON.stringify(demoObjects(read('gallery/scenario/scenario.json')), null, 2),
    };
    for (const name of TEMPLATE_VIEWS) {
        files[`templates/${name}.json`] = JSON.stringify(viewTemplate(read(`gallery/views/${name}.json`), name), null, 2);
    }
    return files;
}
