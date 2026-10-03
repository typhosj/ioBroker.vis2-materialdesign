import { describe, expect, it } from 'vitest';

import renames from './mdiLegacyRenames.json';
import {
    LEGACY_TEMPLATES,
    countLegacyWidgets,
    legacyCssWarnings,
    migrateProject,
    rewriteNamespace,
    type Project,
} from './projectMigration';

const NS = 'vis2-materialdesign.0';

function project(widgets: Record<string, unknown>, extra: Record<string, unknown> = {}): Project {
    return { ___settings: { folders: [] }, main: { settings: {}, widgets, activeWidgets: {} }, ...extra };
}
function widget(result: Project, id: string, view = 'main'): Record<string, unknown> {
    return (result[view] as { widgets: Record<string, Record<string, unknown>> }).widgets[id];
}
// The data without the hidden theme keys every migrated widget gets.
function own(data: unknown): Record<string, unknown> {
    return Object.fromEntries(Object.entries(data as Record<string, unknown>).filter(([key]) => !key.startsWith('__mdwTheme')));
}

describe('migrateProject', () => {
    it('renames the template, sets the widget set and keeps data and style', () => {
        const input = project({
            w1: {
                tpl: 'tplVis-materialdesign-Button-Toggle',
                widgetSet: 'materialdesign',
                data: { oid: 'a.b' },
                style: { left: '10px' },
            },
        });
        const { project: out, report } = migrateProject(input, NS);
        expect({ ...widget(out, 'w1'), data: own(widget(out, 'w1').data) }).toEqual({
            tpl: 'tplVis2-materialdesign-Button-Toggle',
            widgetSet: 'vis2-materialdesign',
            data: { oid: 'a.b' },
            style: { left: '10px' },
        });
        expect(report).toEqual({ widgets: 1, byView: { main: 1 }, unknown: [], warnings: [] });
    });

    it('maps the slider, the one template whose name changed', () => {
        const { project: out } = migrateProject(
            project({ w1: { tpl: 'tplVis-materialdesign-Vuetify-Slider', data: {} } }),
            NS,
        );
        expect(widget(out, 'w1').tpl).toBe('tplVis2-materialdesign-Slider');
    });

    it('sets the widget set even when the old widget had none', () => {
        const { project: out } = migrateProject(project({ w1: { tpl: 'tplVis-materialdesign-Card', data: {} } }), NS);
        expect(widget(out, 'w1').widgetSet).toBe('vis2-materialdesign');
    });

    it('adds one to the count field, number or numeric string, because the old runtime rendered count + 1', () => {
        const input = project({
            n: { tpl: 'tplVis-materialdesign-Chart-Bar', data: { dataCount: 2 } },
            s: { tpl: 'tplVis-materialdesign-Table', data: { countCols: '3' } },
            z: { tpl: 'tplVis-materialdesign-List', data: { countListItems: 0 } },
            v8: { tpl: 'tplVis-materialdesign-view-in-widget8', data: { count: 1 } },
        });
        const { project: out } = migrateProject(input, NS);
        expect((widget(out, 'n').data as Record<string, unknown>).dataCount).toBe(3);
        expect((widget(out, 's').data as Record<string, unknown>).countCols).toBe('4');
        expect((widget(out, 'z').data as Record<string, unknown>).countListItems).toBe(1);
        expect((widget(out, 'v8').data as Record<string, unknown>).count).toBe(2);
    });

    it('leaves a missing, empty or non-numeric count alone', () => {
        const input = project({
            a: { tpl: 'tplVis-materialdesign-Chart-Pie', data: {} },
            b: { tpl: 'tplVis-materialdesign-Chart-Pie', data: { dataCount: '' } },
            c: { tpl: 'tplVis-materialdesign-Chart-Pie', data: { dataCount: 'abc' } },
            d: { tpl: 'tplVis-materialdesign-Chart-Pie', data: { dataCount: -1 } },
        });
        const { project: out } = migrateProject(input, NS);
        expect(own(widget(out, 'a').data)).toEqual({});
        expect((widget(out, 'b').data as Record<string, unknown>).dataCount).toBe('');
        expect((widget(out, 'c').data as Record<string, unknown>).dataCount).toBe('abc');
        expect((widget(out, 'd').data as Record<string, unknown>).dataCount).toBe(-1);
    });

    it('does not touch a count field of a widget that has no count semantics', () => {
        const { project: out } = migrateProject(
            project({ w: { tpl: 'tplVis-materialdesign-Card', data: { count: 2 } } }),
            NS,
        );
        expect((widget(out, 'w').data as Record<string, unknown>).count).toBe(2);
    });

    it('is idempotent: a second run changes nothing and counts nothing', () => {
        const once = migrateProject(
            project({
                w: { tpl: 'tplVis-materialdesign-Chart-Bar', data: { dataCount: 2, oid0: 'vis-materialdesign.0.x' } },
            }),
            NS,
        ).project;
        const twice = migrateProject(once, NS);
        expect(twice.project).toEqual(once);
        expect(twice.report.widgets).toBe(0);
    });

    it('rewrites the old namespace in every widget, also in widgets of other sets', () => {
        const input = project({
            h: { tpl: 'tplHtml', widgetSet: 'basic', data: { html: '{vis-materialdesign.0.colors.darkTheme}' } },
            b: { tpl: 'tplVis-materialdesign-Button-State', data: { oid: 'vis-materialdesign.1.colors.light.x' } },
        });
        const { project: out } = migrateProject(input, NS);
        expect((widget(out, 'h').data as Record<string, unknown>).html).toBe(
            '{vis2-materialdesign.0.colors.darkTheme}',
        );
        expect((widget(out, 'b').data as Record<string, unknown>).oid).toBe('vis2-materialdesign.0.colors.light.x');
        expect(widget(out, 'h').tpl).toBe('tplHtml');
    });

    it('reports an unknown old template and leaves it as it is', () => {
        const { project: out, report } = migrateProject(
            project({ w: { tpl: 'tplVis-materialdesign-Nonexistent', data: {} } }),
            NS,
        );
        expect(widget(out, 'w').tpl).toBe('tplVis-materialdesign-Nonexistent');
        expect(report.unknown).toEqual(['main/w: tplVis-materialdesign-Nonexistent']);
        expect(report.widgets).toBe(0);
    });

    it('warns about the old JavaScript API it cannot convert', () => {
        const { report } = migrateProject(
            project({ h: { tpl: 'tplHtml', data: { html: '<script>vis.binds.materialdesign.helper.x()</script>' } } }),
            NS,
        );
        expect(report.warnings).toEqual(['main/h: vis.binds.materialdesign']);
    });

    it('skips ___settings and malformed views without throwing', () => {
        const input: Project = {
            ___settings: { tpl: 'tplVis-materialdesign-Card' },
            broken: null,
            alsoBroken: 'x',
            noWidgets: {},
        };
        expect(() => migrateProject(input, NS)).not.toThrow();
        expect(migrateProject(input, NS).report.widgets).toBe(0);
    });

    it('does not change its input', () => {
        const input = project({ w: { tpl: 'tplVis-materialdesign-Card', data: { oid: 'vis-materialdesign.0.a' } } });
        const copy = JSON.parse(JSON.stringify(input));
        migrateProject(input, NS);
        expect(input).toEqual(copy);
    });
});

// Default values the old editor saved into the color, font and font-size fields of these templates
// (`widgets/materialdesign.html` before d0632815).
const SWITCH = {
    valueFontFamily: '#mdwTheme:vis-materialdesign.0.fonts.switch.value',
    valueFontSize: '#mdwTheme:vis-materialdesign.0.fontSizes.switch.value',
    colorSwitchThumb: '#mdwTheme:vis-materialdesign.0.colors.switch.off',
    colorSwitchTrack: '#mdwTheme:vis-materialdesign.0.colors.switch.track',
    colorSwitchTrue: '#mdwTheme:vis-materialdesign.0.colors.switch.on',
    colorSwitchHover: '#mdwTheme:vis-materialdesign.0.colors.switch.off_hover',
    colorSwitchHoverTrue: '#mdwTheme:vis-materialdesign.0.colors.switch.on_hover',
    labelColorFalse: '#mdwTheme:vis-materialdesign.0.colors.switch.text_off',
    labelColorTrue: '#mdwTheme:vis-materialdesign.0.colors.switch.text_on',
    lockIconColor: '#mdwTheme:vis-materialdesign.0.colors.switch.lock_icon',
};
const CARD = {
    titleLayout: '#mdwTheme:vis-materialdesign.0.fontSizes.card.title',
    titleFontFamily: '#mdwTheme:vis-materialdesign.0.fonts.card.title',
    subtitleLayout: '#mdwTheme:vis-materialdesign.0.fontSizes.card.subTitle',
    subTitleFontFamily: '#mdwTheme:vis-materialdesign.0.fonts.card.subTitle',
    textFontSize: '#mdwTheme:vis-materialdesign.0.fontSizes.card.text',
    textFontFamily: '#mdwTheme:vis-materialdesign.0.fonts.card.text',
    colorBackground: '#mdwTheme:vis-materialdesign.0.colors.card.background',
    colorTitleSectionBackground: '#mdwTheme:vis-materialdesign.0.colors.card.background_title',
    colorTextSectionBackground: '#mdwTheme:vis-materialdesign.0.colors.card.background_body',
    colorTitle: '#mdwTheme:vis-materialdesign.0.colors.card.title',
    colorSubtitle: '#mdwTheme:vis-materialdesign.0.colors.card.subTitle',
    colorBody: '#mdwTheme:vis-materialdesign.0.colors.card.text',
};
const LIST = {
    headerTextColor: '#mdwTheme:vis-materialdesign.0.colors.list.header_main',
    headerTextSize: '#mdwTheme:vis-materialdesign.0.fontSizes.list.header_main',
    headerFontFamily: '#mdwTheme:vis-materialdesign.0.fonts.list.header',
    listBackground: '#mdwTheme:vis-materialdesign.0.colors.list.background',
    colorSwitchTrue: '#mdwTheme:vis-materialdesign.0.colors.switch.on',
    colorCheckBox: '#mdwTheme:vis-materialdesign.0.colors.checkbox.on',
    colorListItemText: '#mdwTheme:vis-materialdesign.0.colors.list.text',
    listItemFont: '#mdwTheme:vis-materialdesign.0.fonts.list.text',
    listItemTextSize: '#mdwTheme:vis-materialdesign.0.fontSizes.list.text',
    listImageColor0: '#mdwTheme:vis-materialdesign.0.colors.list.icon_off',
    listImageColor1: '#mdwTheme:vis-materialdesign.0.colors.list.icon_off',
    listImageActiveColor0: '#mdwTheme:vis-materialdesign.0.colors.list.icon_on',
};
const color = (name: string): string => `var(--materialdesign-widget-theme-color-${name})`;
const font = (name: string): string => `var(--materialdesign-widget-theme-font-${name})`;
const fontSize = (name: string): string => `var(--materialdesign-widget-theme-font-size-${name})`;

describe('migrateProject: theme tokens', () => {
    function migrated(tpl: string, data: unknown): Record<string, unknown> {
        const input = project({ w: { tpl: `tplVis-materialdesign-${tpl}`, data } });
        return widget(migrateProject(input, NS).project, 'w').data as Record<string, unknown>;
    }

    it('points every Switch token at the theme variable and adds the hidden theme keys', () => {
        const data = migrated('Switch', { ...SWITCH, oid: 'a.b', labelTrue: 'on' });
        expect(own(data)).toEqual({
            oid: 'a.b',
            labelTrue: 'on',
            valueFontFamily: font('switch-value'),
            valueFontSize: fontSize('switch-value'),
            colorSwitchThumb: color('switch-off'),
            colorSwitchTrack: color('switch-track'),
            colorSwitchTrue: color('switch-on'),
            colorSwitchHover: color('switch-off-hover'),
            colorSwitchHoverTrue: color('switch-on-hover'),
            labelColorFalse: color('switch-text-off'),
            labelColorTrue: color('switch-text-on'),
            lockIconColor: color('switch-lock-icon'),
        });
        expect(data.__mdwThemeDark).toBe('vis2-materialdesign.0.colors.darkTheme');
        expect(data.__mdwTheme_colors_light_d_switch_d_on_0).toBe('vis2-materialdesign.0.colors.light.switch.on');
        expect(data.__mdwTheme_colors_light_d_switch_d_on_0_dark).toBe('vis2-materialdesign.0.colors.dark.switch.on');
        expect(data.__mdwTheme_colors_light_d_switch_d_lock_u_icon_7_dark).toBe('vis2-materialdesign.0.colors.dark.switch.lock_icon');
        expect(data.__mdwTheme_fonts_switch_d_value_8).toBe('vis2-materialdesign.0.fonts.switch.value');
        expect(data.__mdwTheme_fontSizes_switch_d_value_9).toBe('vis2-materialdesign.0.fontSizes.switch.value');
        // __mdwThemeDark, 8 colors with their dark twin, 1 font, 1 font size.
        expect(Object.keys(data).filter(key => key.startsWith('__mdwTheme'))).toHaveLength(1 + 8 * 2 + 2);
    });

    it('converts the Card and the List, including indexed fields', () => {
        expect(own(migrated('Card', CARD))).toEqual({
            titleLayout: fontSize('card-title'),
            titleFontFamily: font('card-title'),
            subtitleLayout: fontSize('card-subTitle'),
            subTitleFontFamily: font('card-subTitle'),
            textFontSize: fontSize('card-text'),
            textFontFamily: font('card-text'),
            colorBackground: color('card-background'),
            colorTitleSectionBackground: color('card-background-title'),
            colorTextSectionBackground: color('card-background-body'),
            colorTitle: color('card-title'),
            colorSubtitle: color('card-subTitle'),
            colorBody: color('card-text'),
        });
        const list = migrated('List', LIST);
        expect(own(list)).toEqual({
            headerTextColor: color('list-header-main'),
            headerTextSize: fontSize('list-header-main'),
            headerFontFamily: font('list-header'),
            listBackground: color('list-background'),
            colorSwitchTrue: color('switch-on'),
            colorCheckBox: color('checkbox-on'),
            colorListItemText: color('list-text'),
            listItemFont: font('list-text'),
            listItemTextSize: fontSize('list-text'),
            listImageColor0: color('list-icon-off'),
            listImageColor1: color('list-icon-off'),
            listImageActiveColor0: color('list-icon-on'),
        });
        expect(Object.keys(list).some(key => /^__mdwTheme_colors_light_d_list_d_icon_u_off_\d+_dark$/.test(key))).toBe(true);
    });

    it('keeps plain values and hidden keys the widget already has', () => {
        const data = migrated('Switch', {
            ...SWITCH,
            colorSwitchTrue: '#ff0000',
            valueFontSize: 14,
            __mdwThemeDark: 'my.own.dark',
            __mdwTheme_colors_light_d_switch_d_on_0: 'my.own.on',
        });
        expect(data.colorSwitchTrue).toBe('#ff0000');
        expect(data.valueFontSize).toBe(14);
        expect(data.__mdwThemeDark).toBe('my.own.dark');
        expect(data.__mdwTheme_colors_light_d_switch_d_on_0).toBe('my.own.on');
        expect(data.__mdwTheme_colors_light_d_switch_d_on_0_dark).toBe('vis2-materialdesign.0.colors.dark.switch.on');
    });

    it('drops a token the widget has no theme entry for, so the widget falls back to its own default', () => {
        const data = migrated('value', {
            effectFontColor: '#mdwTheme:vis-materialdesign.0.colors.value.effect',
            other: '#mdwTheme:vis-materialdesign.0.shadows.value.text',
            empty: '#mdwTheme:',
            ownNamespace: '#mdwTheme:vis2-materialdesign.0.colors.value.text',
            valuesFontColor: '#mdwTheme:vis-materialdesign.0.colors.value.text',
        });
        expect(own(data)).toEqual({ valuesFontColor: color('value-text') });
    });

    it('leaves non-string values alone, also a token nested in an object', () => {
        const data = { b: null, c: 5, d: { x: SWITCH.colorSwitchTrue }, e: [SWITCH.colorSwitchTrue] };
        expect(own(migrated('Switch', data))).toEqual(data);
    });

    it('does not throw on missing or malformed data and adds nothing there', () => {
        expect(migrated('Switch', undefined)).toBeUndefined();
        expect(migrated('Switch', null)).toBeNull();
        expect(migrated('Switch', ['x'])).toEqual(['x']);
        expect(migrated('Switch', 'text')).toBe('text');
    });

    it('is idempotent', () => {
        const once = migrateProject(
            project({ s: { tpl: 'tplVis-materialdesign-Switch', data: { ...SWITCH } }, l: { tpl: 'tplVis-materialdesign-List', data: { ...LIST } } }),
            NS,
        ).project;
        expect(migrateProject(once, NS).project).toEqual(once);
    });

    it('does not touch tokens in a widget it does not migrate', () => {
        const out = migrateProject(project({ w: { tpl: 'tplVis-materialdesign-Nonexistent', data: { ...SWITCH } } }), NS).project;
        expect(widget(out, 'w').data).toEqual(SWITCH);
    });
});

describe('rewriteNamespace', () => {
    it('keeps #mdwTheme: tokens, which MaterialDesignInput matches by the literal old namespace', () => {
        expect(rewriteNamespace('#mdwTheme:vis-materialdesign.0.colors.input.border', NS)).toBe(
            '#mdwTheme:vis-materialdesign.0.colors.input.border',
        );
    });
    it('does not match inside our own namespace or a longer adapter name', () => {
        expect(rewriteNamespace('vis2-materialdesign.0.a', NS)).toBe('vis2-materialdesign.0.a');
        expect(rewriteNamespace('my-vis-materialdesign.0.a', NS)).toBe('my-vis-materialdesign.0.a');
    });
    it('rewrites every occurrence and any instance number', () => {
        expect(rewriteNamespace('{a:vis-materialdesign.0.x;b:vis-materialdesign.12.y; a}', NS)).toBe(
            '{a:vis2-materialdesign.0.x;b:vis2-materialdesign.0.y; a}',
        );
    });
    it('needs the trailing dot, so a bare adapter name stays', () => {
        expect(rewriteNamespace('vis-materialdesign', NS)).toBe('vis-materialdesign');
    });
});

describe('countLegacyWidgets', () => {
    it('counts old widgets across views and ignores everything else', () => {
        const input = project(
            { a: { tpl: 'tplVis-materialdesign-Card' }, b: { tpl: 'tplHtml' } },
            { second: { widgets: { c: { tpl: 'tplVis-materialdesign-List' } } } },
        );
        expect(countLegacyWidgets(input)).toBe(2);
        expect(countLegacyWidgets({})).toBe(0);
    });
});

describe('legacyCssWarnings', () => {
    it('lists each legacy selector once', () => {
        expect(
            legacyCssWarnings(
                '.mdc-switch__track{} .v-btn{} .mdc-switch__track:hover{} .materialdesign-button-body{} .other{}',
            ),
        ).toEqual(['.mdc-switch__track', '.v-btn', '.materialdesign-button-body']);
    });
    it('returns nothing for empty css', () => {
        expect(legacyCssWarnings('')).toEqual([]);
    });
});

describe('LEGACY_TEMPLATES', () => {
    it('holds the 49 templates of the old widget set', () => {
        expect(LEGACY_TEMPLATES).toHaveLength(49);
        expect(new Set(LEGACY_TEMPLATES).size).toBe(49);
    });
});

describe('MDI 6 → 7 icon names', () => {
    const [OLD, NEW] = Object.entries(renames.renamed)[0];
    const GONE = renames.removed[0];

    it('renames an icon MDI lists as an alias of its successor, bare or with mdi- prefix', () => {
        const input = project({
            w: { tpl: 'tplVis-materialdesign-Button-State', data: { image: OLD, imageTrue: `mdi-${OLD}` } },
        });
        const data = widget(migrateProject(input, NS).project, 'w').data as Record<string, unknown>;
        expect(data.image).toBe(NEW);
        expect(data.imageTrue).toBe(`mdi-${NEW}`);
    });

    it('warns about an icon that has no successor and leaves it', () => {
        const { project: out, report } = migrateProject(
            project({ w: { tpl: 'tplVis-materialdesign-Icon', data: { mdwIcon: GONE } } }),
            NS,
        );
        expect((widget(out, 'w').data as Record<string, unknown>).mdwIcon).toBe(GONE);
        expect(report.warnings).toContain(`main/w: icon ${GONE}`);
    });

    it('does not touch the same word in a widget of another set or inside a longer text', () => {
        const input = project({
            h: { tpl: 'tplHtml', data: { html: OLD } },
            w: { tpl: 'tplVis-materialdesign-Card', data: { title: `${OLD} light` } },
        });
        const out = migrateProject(input, NS).project;
        expect((widget(out, 'h').data as Record<string, unknown>).html).toBe(OLD);
        expect((widget(out, 'w').data as Record<string, unknown>).title).toBe(`${OLD} light`);
    });
    it('leaves inherited object property names alone', () => {
        const values = ['constructor', 'toString', '__proto__', 'mdi-constructor'];
        const data = Object.fromEntries(values.map((value, i) => [`f${i}`, value]));
        const { project: out, report } = migrateProject(
            project({ w: { tpl: 'tplVis-materialdesign-Icon', data } }),
            NS,
        );
        expect(own(widget(out, 'w').data)).toEqual(data);
        expect(report.warnings).toEqual([]);
    });

    it('warns about a removed icon with the mdi- prefix and leaves it', () => {
        const { project: out, report } = migrateProject(
            project({ w: { tpl: 'tplVis-materialdesign-Icon', data: { mdwIcon: `mdi-${GONE}` } } }),
            NS,
        );
        expect((widget(out, 'w').data as Record<string, unknown>).mdwIcon).toBe(`mdi-${GONE}`);
        expect(report.warnings).toEqual([`main/w: icon ${GONE}`]);
    });

    it('ignores empty values, a bare prefix and non-string fields', () => {
        const data = { a: '', b: 'mdi-', c: 5, d: null, e: { icon: OLD }, f: [OLD], g: true, mdwIcon: OLD };
        const { project: out, report } = migrateProject(
            project({ w: { tpl: 'tplVis-materialdesign-Icon', data } }),
            NS,
        );
        expect(own(widget(out, 'w').data)).toEqual({ ...data, mdwIcon: NEW });
        expect(report.warnings).toEqual([]);
    });

    it('is idempotent: a second run renames nothing more and warns about nothing', () => {
        const once = migrateProject(
            project({ w: { tpl: 'tplVis-materialdesign-Icon', data: { a: OLD, b: GONE } } }),
            NS,
        ).project;
        const twice = migrateProject(once, NS);
        expect(twice.project).toEqual(once);
        expect(twice.report.warnings).toEqual([]);
    });
});
