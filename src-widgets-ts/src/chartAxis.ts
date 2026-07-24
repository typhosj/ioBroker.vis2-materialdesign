// Shared chart.js v4 cartesian axis builder for the Bar / JSON / Line-History
// charts. Every field is optional; only the ones that are actually set are
// emitted, so chart.js keeps its own defaults for the rest. This is what lets
// the editor "axis layout" groups (show/hide, position, grid lines, tick
// labels, title, colors) take effect instead of being silently ignored.
//
// v4 note: scales moved from the v2 `{xAxes:[…],yAxes:[…]}` arrays to a keyed
// object (`scales: { x, y, <id> }`) — callers key this builder's output by id.
// Field renames handled here: ticks.fontColor→color, fontFamily/fontSize→font,
// gridLines→grid (+tickMarkLength→tickLength), scaleLabel→title (labelString→
// text, fontColor→color, font*). min/max moved from ticks to the scale level.
// zeroLine* has no v4 equivalent (dropped).
export type AxisSpec = {
    id?: string;
    axis?: 'x' | 'y'; // v4: pin the axis kind for custom-id scales (don't rely on position/id inference)
    type?: string; // 'linear' | 'time' | undefined (=> category default)
    position?: string; // left/right/top/bottom
    display?: boolean; // show/hide the whole axis
    stacked?: boolean;
    labelsDisplay?: boolean; // tick labels
    labelColor?: string;
    labelFontFamily?: string;
    labelFontSize?: number;
    labelPadding?: number;
    tickCallback?: (value: unknown, index: number) => string; // v4 ticks.callback (e.g. time labels)
    min?: number;
    max?: number;
    stepSize?: number;
    title?: string;
    titleColor?: string;
    titleFontFamily?: string;
    titleFontSize?: number;
    gridDisplay?: boolean;
    gridColor?: string;
    gridWidth?: number;
    drawTicks?: boolean;
    tickLength?: number;
    time?: Record<string, unknown>;
};

const has = (v: unknown): boolean => v !== undefined && v !== null && v !== '';

export function chartAxis(a: AxisSpec): Record<string, unknown> {
    const ticks: Record<string, unknown> = {};
    if (a.labelsDisplay !== undefined) ticks.display = a.labelsDisplay;
    if (has(a.labelColor)) ticks.color = a.labelColor;
    const tickFont: Record<string, unknown> = {};
    if (has(a.labelFontFamily)) tickFont.family = a.labelFontFamily;
    if (a.labelFontSize) tickFont.size = a.labelFontSize;
    if (Object.keys(tickFont).length) ticks.font = tickFont;
    if (a.labelPadding !== undefined) ticks.padding = a.labelPadding;
    if (a.stepSize !== undefined) ticks.stepSize = a.stepSize;
    if (a.tickCallback) ticks.callback = a.tickCallback;

    const grid: Record<string, unknown> = {};
    if (a.gridDisplay !== undefined) grid.display = a.gridDisplay;
    if (has(a.gridColor)) grid.color = a.gridColor;
    if (a.gridWidth) grid.lineWidth = a.gridWidth;
    if (a.drawTicks !== undefined) grid.drawTicks = a.drawTicks;
    if (a.tickLength !== undefined) grid.tickLength = a.tickLength;

    const title: Record<string, unknown> = {};
    if (has(a.title)) {
        title.display = true;
        title.text = a.title;
    }
    if (has(a.titleColor)) title.color = a.titleColor;
    const titleFont: Record<string, unknown> = {};
    if (has(a.titleFontFamily)) titleFont.family = a.titleFontFamily;
    if (a.titleFontSize) titleFont.size = a.titleFontSize;
    if (Object.keys(titleFont).length) title.font = titleFont;

    const axis: Record<string, unknown> = {};
    if (has(a.axis)) axis.axis = a.axis;
    if (has(a.type)) axis.type = a.type;
    if (has(a.position)) axis.position = a.position;
    if (a.display !== undefined) axis.display = a.display;
    if (a.stacked !== undefined) axis.stacked = a.stacked;
    if (a.min !== undefined) axis.min = a.min;
    if (a.max !== undefined) axis.max = a.max;
    if (a.time) axis.time = a.time;
    if (Object.keys(ticks).length) axis.ticks = ticks;
    if (Object.keys(grid).length) axis.grid = grid;
    if (Object.keys(title).length) axis.title = title;
    return axis;
}

// Material 3 (Phase 7, ../../MATERIAL3_PLAN.md): concrete chart-internal colors for the M3 render
// path. Chart.js paints on a <canvas>, which cannot resolve CSS custom properties, so the token
// values from material3-tokens.css (Google's baseline scheme) are inlined here as concrete hex,
// dark-aware. Only the DOM card/title surfaces use the CSS-var tokens; everything drawn on the
// canvas (axis text, grid, default series color) uses these.
export function m3ChartColors(isDark: boolean): { text: string; grid: string; primary: string } {
    return isDark
        ? { text: '#cac4d0', grid: '#49454f', primary: '#d0bcff' }
        : { text: '#49454f', grid: '#cac4d0', primary: '#6750a4' };
}
