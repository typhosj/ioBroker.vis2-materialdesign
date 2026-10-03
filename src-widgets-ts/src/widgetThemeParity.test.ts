import { describe, expect, it } from 'vitest';

import { LEGACY_TEMPLATES, migrateProject, type Project } from '../../src-admin/src/projectMigration';
import { applyThemeVariables } from './widgetUtils';

type Field = { name?: string; type?: string; default?: unknown };
type Info = { id: string; visAttrs: Array<{ fields: Field[] }> };
type WidgetModule = { default?: { getWidgetInfo?: () => Info } };

const modules = import.meta.glob<WidgetModule>(['./MaterialDesign*.tsx', '!./MaterialDesign*.test.tsx'], { eager: true });
const infos = new Map(
    Object.values(modules)
        .map(module => module.default?.getWidgetInfo?.())
        .filter((info): info is Info => !!info)
        .map(info => [info.id, info]),
);

function migrate(template: string, data: Record<string, unknown>): { tpl: string; data: Record<string, unknown> } {
    const project: Project = { main: { widgets: { w: { tpl: `tplVis-materialdesign-${template}`, data } } } };
    const out = migrateProject(project, 'vis2-materialdesign.0').project as { main: { widgets: { w: { tpl: string; data: Record<string, unknown> } } } };
    return out.main.widgets.w;
}

// The migration writes, for a widget vis-2 never inserted, what the editor writes on insert.
describe('migrated widgets carry the theme keys their widget declares', () => {
    it.each(LEGACY_TEMPLATES)('%s', template => {
        const { tpl, data } = migrate(template, {});
        const info = infos.get(tpl);
        expect(info, `no widget class with id ${tpl}`).toBeDefined();
        const declared = Object.fromEntries(
            info!.visAttrs.flatMap(group => group.fields).filter(field => field.name?.startsWith('__mdwTheme')).map(field => [field.name, field.default]),
        );
        expect(info!.visAttrs.flatMap(group => group.fields).filter(field => field.name?.startsWith('__mdwTheme')).every(field => field.type === 'id')).toBe(true);
        expect(data).toEqual(declared);

        // Every theme token becomes a var() that the widget runtime actually sets from that state.
        const lightKeys = Object.keys(declared).filter(key => key.startsWith('__mdwTheme_') && !key.endsWith('_dark'));
        const tokens: Record<string, string> = {};
        const values: Record<string, ioBroker.StateValue> = {};
        lightKeys.forEach((key, index) => {
            const [, type, id] = String(declared[key]).match(/^vis2-materialdesign\.0\.(colors|fonts|fontSizes)\.(.+)$/)!;
            tokens[`field${index}`] = `#mdwTheme:vis-materialdesign.0.${type}.${id.replace(/^light\./, '')}`;
            values[`${String(declared[key])}.val`] = type === 'fontSizes' ? index + 1 : `value${index}`;
        });
        const themed = migrate(template, tokens).data;
        const element = document.createElement('div');
        applyThemeVariables(element, themed, values);
        lightKeys.forEach((key, index) => {
            const variable = String(themed[`field${index}`]).match(/^var\((--[\w-]+)\)$/)?.[1];
            expect(variable, `field${index} of ${template}`).toBeDefined();
            const expected = key.startsWith('__mdwTheme_fontSizes_') ? `${index + 1}px` : `value${index}`;
            expect(element.style.getPropertyValue(variable!)).toBe(expected);
        });
    });
});
