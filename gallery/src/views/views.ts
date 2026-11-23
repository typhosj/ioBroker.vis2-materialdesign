import { entryByTpl } from '../runtime/widgets';

export interface ViewWidget { tpl: string; data: Record<string, unknown>; style: { left: number | string; top: number | string; width: number | string; height: number | string } }
export interface ViewFile { settings?: { style?: Record<string, unknown> }; widgets: Record<string, ViewWidget> }

const files = import.meta.glob<{ default: ViewFile }>('../../views/*.json', { eager: true });
export const VIEWS: Record<string, ViewFile> = Object.fromEntries(Object.entries(files).map(([path, mod]) => [path.replace(/^.*\/(.+)\.json$/, '$1'), mod.default]));

const FOREIGN_ID = /^(?!0_userdata\.0\.demo\.|vis2-materialdesign\.0\.)[a-z0-9_-]+\.\d+\./i;
// Names of the `type: 'views'` fields; indexed ones carry an index suffix in the data.
export const VIEW_FIELD = /^(View\d*|contains_view(_\d+)?|nav_view|listTypeButtonNav\d*)$/;

export function viewProblems(views: Record<string, ViewFile>): string[] {
    const problems: string[] = [];
    for (const [name, view] of Object.entries(views)) {
        for (const [id, widget] of Object.entries(view.widgets)) {
            if (!entryByTpl(widget.tpl)) { problems.push(`${name}/${id}: unknown tpl ${widget.tpl}`); continue; }
            for (const [key, value] of Object.entries(widget.data)) {
                if (typeof value !== 'string' || !value) continue;
                if (FOREIGN_ID.test(value)) problems.push(`${name}/${id}: ${value} is not a demo data point`);
                else if (VIEW_FIELD.test(key) && !(value in views)) problems.push(`${name}/${id}: unknown view ${value}`);
            }
        }
    }
    return problems;
}
