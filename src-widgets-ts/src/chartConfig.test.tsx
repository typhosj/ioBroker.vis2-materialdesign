import { describe, expect, it } from 'vitest';

import { renderToStaticMarkup } from 'react-dom/server';

import { chartConfig, chartNumber, ChartFrame, type ChartSpec } from './MaterialDesignChartCanvas';

// The decimal separator comes from the runtime locale; the tests must not pin it.
const dot = (text: string): string => text.replace(',', '.');

describe('chartNumber', () => {
    it.each([
        // [value, min, max, kind, expected]
        [21.5, undefined, undefined, 'value', '22'],
        [21.5, 2, undefined, 'value', '21.50'],
        [21.5, 2, 0, 'value', '21.50'],
        [21.567, 1, 2, 'value', '21.57'],
        [21.5, -3, -1, 'value', '22'],
        [1, 25, undefined, 'value', `1.${'0'.repeat(20)}`],
        [21.55, 1.9, undefined, 'value', '21.6'],
        [21.5, 'abc', '', 'value', '22'],
        [21.567, undefined, undefined, 'tooltip', '21.57'],
        [21.5, 3, undefined, 'tooltip', '21.500'],
        [21.5, 3, 1, 'tooltip', '21.500'],
        [21.5, undefined, 0, 'tooltip', '22'],
        [21.5, Number.NaN, null, 'tooltip', '21.5'],
    ] as const)('formats %s with min %s / max %s as a %s', (value, min, max, kind, expected) => {
        expect(dot(chartNumber(value, min, max, kind))).toBe(expected);
    });

    it.each([null, undefined, '', 'abc', Number.NaN, Number.POSITIVE_INFINITY])('gives no text for %s', value => {
        expect(chartNumber(value, 2, 2, 'value')).toBe('');
    });

    it('reads a numeric string', () => {
        expect(chartNumber('7', undefined, undefined, 'value')).toBe('7');
    });
});

const itemSpec = (colors: Array<string | undefined>, extra: Partial<ChartSpec> = {}): ChartSpec => ({
    type: 'pie',
    colorBy: 'item',
    labels: colors.map((_c, i) => `item${i}`),
    datasets: [{ label: '', values: colors.map((_c, i) => i + 1), colors }],
    ...extra,
});

const seriesSpec = (colors: Array<string | undefined>): ChartSpec => ({
    type: 'line',
    colorBy: 'dataset',
    datasets: colors.map((color, i) => ({ label: `series${i}`, values: [1, 2], colors: [color] })),
});

describe('chartConfig colours', () => {
    const legacy = { isM3: false, isDark: false };
    const m3 = { isM3: true, isDark: false };

    it('fills item colours explicit, then scheme, then globalColor, then the default', () => {
        const explicit = chartConfig(itemSpec(['#ff0000', undefined]), {}, legacy);
        expect(explicit.data.datasets[0].backgroundColor).toEqual(['#ff0000', '#44739e']);
        const global = chartConfig(itemSpec([undefined]), { globalColor: '#abcdef' }, legacy);
        expect(global.data.datasets[0].backgroundColor).toEqual(['#abcdef']);
        const scheme = chartConfig(itemSpec([undefined, '#ff0000']), { colorScheme: 'scrounger.pie', globalColor: '#abcdef' }, legacy);
        const [first, second] = scheme.data.datasets[0].backgroundColor as string[];
        expect(first).not.toBe('#abcdef');
        expect(first).toMatch(/^#/);
        expect(second).toBe('#ff0000');
    });

    it('takes the M3 primary as default and keeps an explicit #44739e in M3', () => {
        expect(chartConfig(itemSpec([undefined]), {}, m3).data.datasets[0].backgroundColor).toEqual(['#6750a4']);
        expect(chartConfig(itemSpec([undefined]), {}, { isM3: true, isDark: true }).data.datasets[0].backgroundColor).toEqual(['#d0bcff']);
        expect(chartConfig(itemSpec(['#44739e']), {}, m3).data.datasets[0].backgroundColor).toEqual(['#44739e']);
    });

    it('gives each series one colour on line and fill', () => {
        const config = chartConfig(seriesSpec(['#00aa00', undefined]), {}, m3);
        expect(config.data.datasets[0]).toMatchObject({ borderColor: '#00aa00', backgroundColor: '#00aa00' });
        expect(config.data.datasets[1]).toMatchObject({ borderColor: '#6750a4', backgroundColor: '#6750a4' });
    });

    it('draws the legend in exactly the series colours', () => {
        const items = chartConfig(itemSpec(['#ff0000', undefined]), {}, m3);
        expect(items.legend).toEqual([{ label: 'item0', color: '#ff0000' }, { label: 'item1', color: '#6750a4' }]);
        const series = chartConfig(seriesSpec([undefined]), {}, m3);
        expect(series.legend).toEqual([{ label: 'series0', color: series.data.datasets[0].borderColor }]);
    });

    it('hands extra the resolved colours and lets it override', () => {
        const spec = seriesSpec([undefined]);
        spec.datasets[0].extra = resolved => ({ backgroundColor: `${resolved[0]}33`, fill: true });
        expect(chartConfig(spec, {}, legacy).data.datasets[0]).toMatchObject({ borderColor: '#44739e', backgroundColor: '#44739e33', fill: true });
    });
});

describe('chartConfig value labels', () => {
    type Labels = { display: unknown; formatter: (value: unknown, context: { datasetIndex: number; dataIndex: number }) => string; color: (context: object) => string };
    const labels = (config: ReturnType<typeof chartConfig>): Labels => config.options.plugins.datalabels as Labels;

    // Intl throws a RangeError when min > max. A min without a max is what the editor stores when only
    // one of the two fields is filled in, and the throw took the whole vis view down.
    it('formats a min without a max instead of throwing', () => {
        const config = chartConfig(itemSpec([undefined], { valueLabels: { align: 'end', anchor: 'center' } }), { valuesMinDecimals: 2 }, { isM3: false, isDark: false });
        expect(() => labels(config).formatter(0, { datasetIndex: 0, dataIndex: 0 })).not.toThrow();
        expect(dot(labels(config).formatter(0, { datasetIndex: 0, dataIndex: 0 }))).toBe('1.00');
    });

    it('appends valuesAppendText by default and lets the widget reshape the text', () => {
        const plain = chartConfig(itemSpec([undefined], { valueLabels: { align: 'end', anchor: 'center' } }), { valuesAppendText: ' kWh' }, { isM3: false, isDark: false });
        expect(labels(plain).formatter(0, { datasetIndex: 0, dataIndex: 0 })).toBe('1 kWh');
        const shaped = chartConfig(itemSpec([undefined], {
            valueLabels: { align: 'end', anchor: 'center' },
            valueLabel: (point, number, fallback) => ({ ...fallback, text: `${point.label}=${number}` }),
        }), {}, { isM3: false, isDark: false });
        expect(labels(shaped).formatter(0, { datasetIndex: 0, dataIndex: 0 })).toBe('item0=1');
    });

    it('labels nothing for a missing value', () => {
        const spec = seriesSpec([undefined]);
        spec.datasets[0].values = [null, 2];
        spec.valueLabels = { align: 'top', anchor: 'end' };
        expect(labels(chartConfig(spec, {}, { isM3: false, isDark: false })).formatter(0, { datasetIndex: 0, dataIndex: 0 })).toBe('');
    });

    it('keeps chart-wide labels off without a setup and applies a show default', () => {
        expect(chartConfig(itemSpec([undefined]), {}, { isM3: false, isDark: false }).options.plugins.datalabels).toEqual({ display: false });
        const off = chartConfig(itemSpec([undefined], { valueLabels: { align: 'top', anchor: 'end', show: 'showValuesOff' } }), {}, { isM3: false, isDark: false });
        expect(labels(off).display).toBe(false);
        const on = chartConfig(itemSpec([undefined], { valueLabels: { align: 'top', anchor: 'end', show: 'showValuesOff' } }), { showValues: 'showValuesOn' }, { isM3: false, isDark: false });
        expect(labels(on).display).not.toBe(false);
    });

    it('puts per-dataset labels on the dataset with that dataset\'s fields', () => {
        const spec = seriesSpec([undefined, undefined]);
        spec.datasets[1].valueLabels = { fields: { valuesMaxDecimals: 1, valuesAppendText: ' W' }, align: 'top', anchor: 'end' };
        spec.datasets[1].values = [2.25, 4];
        const config = chartConfig(spec, {}, { isM3: false, isDark: false });
        expect(config.data.datasets[0]).not.toHaveProperty('datalabels');
        const own = config.data.datasets[1].datalabels as Labels;
        expect(dot(own.formatter(0, { datasetIndex: 1, dataIndex: 0 }))).toBe('2.3 W');
    });
});

describe('chartConfig tooltip', () => {
    type Callbacks = { label: (item: { datasetIndex?: number; dataIndex?: number }) => unknown; title?: (items: Array<{ datasetIndex?: number; dataIndex?: number }>) => unknown };
    const callbacks = (spec: ChartSpec, data: Record<string, unknown> = {}): Callbacks => chartConfig(spec, data, { isM3: false, isDark: false }).options.plugins.tooltip.callbacks as Callbacks;

    it('prints "<dataset>: <number><append>" with at most two decimals by default', () => {
        const spec = seriesSpec([undefined]);
        spec.datasets[0].values = [21.567, 2];
        expect(dot(String(callbacks(spec, { tooltipBodyAppend: ' °C' }).label({ datasetIndex: 0, dataIndex: 0 })))).toBe('series0: 21.57 °C');
    });

    it('survives a tooltip min above its max', () => {
        const spec = seriesSpec([undefined]);
        expect(() => callbacks(spec, { tooltipValueMinDecimals: 4, tooltipValueMaxDecimals: 1 }).label({ datasetIndex: 0, dataIndex: 0 })).not.toThrow();
    });

    it('hands the widget the point and the formatted number, and leaves the title to chart.js unless asked', () => {
        const plain = callbacks(seriesSpec([undefined]));
        expect(plain).not.toHaveProperty('title');
        const spec = itemSpec(['#ff0000'], { tooltip: { title: point => `t:${point.label}`, label: (point, number) => `${point.label}|${number}|${point.color}` } });
        const shaped = callbacks(spec);
        expect(shaped.title?.([{ datasetIndex: 0, dataIndex: 0 }])).toBe('t:item0');
        expect(shaped.label({ datasetIndex: 0, dataIndex: 0 })).toBe('item0|1|#ff0000');
    });

    it('passes the tooltip box options through', () => {
        const tooltip = chartConfig(seriesSpec([undefined]), { tooltipArrowSize: 8, tooltipMode: 'index' }, { isM3: false, isDark: false }).options.plugins.tooltip;
        expect(tooltip).toMatchObject({ caretSize: 8, mode: 'index' });
    });
});

describe('chartConfig options', () => {
    it('carries scales, extra options and the chart area colour', () => {
        const config = chartConfig(itemSpec([undefined], { scales: { x: { type: 'linear' } }, options: { cutout: '50%' } }), { chartAreaBackgroundColor: '#101010', animationDuration: 0 }, { isM3: false, isDark: false });
        expect(config.type).toBe('pie');
        expect(config.options).toMatchObject({ responsive: true, maintainAspectRatio: false, cutout: '50%', scales: { x: { type: 'linear' } }, animation: { duration: 0 } });
        expect(config.options.plugins).toMatchObject({ legend: { display: false }, mdwChartArea: { color: '#101010' } });
    });

    it('builds {x,y} points when the dataset has x values', () => {
        const spec = seriesSpec([undefined]);
        spec.datasets[0].x = [100, 200];
        expect(chartConfig(spec, {}, { isM3: false, isDark: false }).data.datasets[0].data).toEqual([{ x: 100, y: 1 }, { x: 200, y: 2 }]);
    });
});

describe('ChartFrame', () => {
    const config = chartConfig(itemSpec(['#ff0000']), {}, { isM3: false, isDark: false });
    const html = (data: Record<string, unknown>, extra: { error?: string; legendShown?: boolean } = {}): string =>
        renderToStaticMarkup(<ChartFrame data={data} isDark={false} config={config} legendShown={extra.legendShown ?? true} error={extra.error} />);

    it('draws the card with title around legend and canvas', () => {
        const markup = html({ cardUse: true, title: '<b>Energy</b>', showLegend: true });
        expect(markup).toContain('mdc-card');
        expect(markup).toContain('<b>Energy</b>');
        expect(markup.indexOf('mdc-card')).toBeLessThan(markup.indexOf('item0'));
        expect(markup).toContain('<canvas');
    });

    it('puts the legend after the chart for an unset or right position, before it for top/left', () => {
        expect(html({ showLegend: true }).indexOf('item0')).toBeGreaterThan(html({ showLegend: true }).indexOf('<canvas'));
        expect(html({ showLegend: true, legendPosition: 'left' }).indexOf('item0')).toBeLessThan(html({ showLegend: true, legendPosition: 'left' }).indexOf('<canvas'));
        expect(html({ showLegend: true, legendPosition: 'bottom' })).toContain('flex-direction:column');
        expect(html({ showLegend: true, cardUse: true, legendPosition: 'right' })).toContain('flex-direction:row');
    });

    it('hides the legend when the widget default says so and nothing is saved', () => {
        expect(html({}, { legendShown: false })).not.toContain('item0');
        expect(html({}, { legendShown: true })).toContain('item0');
    });

    it('shows the error instead of the chart', () => {
        const markup = html({ cardUse: true }, { error: 'Error in JSON string' });
        expect(markup).toContain('Error in JSON string');
        expect(markup).not.toContain('<canvas');
    });

    // The canvas cannot read CSS variables; without a surface of its own the dark M3 palette ended up
    // on the light page behind it.
    it('paints the M3 surface unless a background is configured', () => {
        expect(html({ designStyle: 'material3' })).toContain('var(--md-sys-color-surface)');
        expect(html({ designStyle: 'material3', backgroundColor: '#ff0000' })).not.toContain('var(--md-sys-color-surface)');
        expect(html({ designStyle: 'legacy' })).not.toContain('var(--md-sys-color-surface)');
    });
});
