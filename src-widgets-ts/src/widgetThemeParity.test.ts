import { describe, expect, it } from 'vitest';

import { LEGACY_TEMPLATES, migrateProject, type Project } from '../../src-admin/src/projectMigration';
import { applyThemeVariables } from './widgetUtils';
import { themeEntries } from './themeKeys';

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

// A colour field the shared chart groups declare must follow the theme in every chart widget that
// declares it, or "use theme" silently leaves it at its own value in one of them.
describe('chart widgets theme their shared colour fields alike', () => {
    const charts: Array<[string, string]> = [
        ['tplVis2-materialdesign-Chart-Bar', 'Bar Chart'],
        ['tplVis2-materialdesign-Chart-Pie', 'Pie Chart'],
        ['tplVis2-materialdesign-Chart-JSON', 'JSON Chart'],
        ['tplVis2-materialdesign-Chart-Line-History', 'Line History Chart'],
    ];
    const shared = ['card', 'legendLayout', 'tooltipLayout', 'barValuesLayout', 'pieValuesLayout'];
    const declared = (id: string): string[] => (infos.get(id)!.visAttrs as Array<{ name?: string; fields: Field[] }>)
        .filter(group => shared.includes(group.name ?? ''))
        .flatMap(group => group.fields)
        .filter(field => field.type === 'color')
        .map(field => field.name!);
    const themed = (name: string): Set<string> => new Set(themeEntries(name).filter(({ type }) => type === 'colors').map(({ entry }) => entry.desc));

    it('declares the same shared groups field for field', () => {
        const fieldsOf = (id: string, group: string): string[] => (infos.get(id)!.visAttrs as Array<{ name?: string; fields: Field[] }>).find(g => g.name === group)?.fields.map(f => f.name!) ?? [];
        for (const group of ['card', 'legendLayout', 'tooltipLayout']) {
            const reference = fieldsOf(charts[0][0], group);
            for (const [id] of charts) expect(fieldsOf(id, group), `${group} of ${id}`).toEqual(reference);
        }
    });

    it.each(charts)('%s themes every shared colour field another chart themes', (id, name) => {
        const themedSomewhere = new Set(charts.flatMap(([otherId, otherName]) => declared(otherId).filter(field => themed(otherName).has(field))));
        const missing = declared(id).filter(field => themedSomewhere.has(field) && !themed(name).has(field));
        expect(missing).toEqual([]);
    });
});
