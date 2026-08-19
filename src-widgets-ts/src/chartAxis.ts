// Shared chart.js v2 cartesian axis builder for the Bar / JSON / Line-History
// charts. Every field is optional; only the ones that are actually set are
// emitted, so chart.js keeps its own defaults for the rest. This is what lets
// the editor "axis layout" groups (show/hide, position, grid lines, tick
// labels, title, colors) take effect instead of being silently ignored.
export type AxisSpec = {
    id?: string;
    type?: string; // 'linear' | 'time' | undefined (=> category default)
    position?: string; // left/right/top/bottom
    display?: boolean; // show/hide the whole axis
    stacked?: boolean;
    labelsDisplay?: boolean; // tick labels
    labelColor?: string;
    labelFontFamily?: string;
    labelFontSize?: number;
    labelPadding?: number;
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
    if (has(a.labelColor)) ticks.fontColor = a.labelColor;
    if (has(a.labelFontFamily)) ticks.fontFamily = a.labelFontFamily;
    if (a.labelFontSize) ticks.fontSize = a.labelFontSize;
    if (a.labelPadding !== undefined) ticks.padding = a.labelPadding;
    if (a.min !== undefined) ticks.min = a.min;
    if (a.max !== undefined) ticks.max = a.max;
    if (a.stepSize !== undefined) ticks.stepSize = a.stepSize;

    const gridLines: Record<string, unknown> = {};
    if (a.gridDisplay !== undefined) gridLines.display = a.gridDisplay;
    if (has(a.gridColor)) gridLines.color = a.gridColor;
    if (a.gridWidth) gridLines.lineWidth = a.gridWidth;
    if (a.drawTicks !== undefined) gridLines.drawTicks = a.drawTicks;
    if (a.tickLength !== undefined) gridLines.tickMarkLength = a.tickLength;

    const scaleLabel: Record<string, unknown> = {};
    if (has(a.title)) {
        scaleLabel.display = true;
        scaleLabel.labelString = a.title;
    }
    if (has(a.titleColor)) scaleLabel.fontColor = a.titleColor;
    if (has(a.titleFontFamily)) scaleLabel.fontFamily = a.titleFontFamily;
    if (a.titleFontSize) scaleLabel.fontSize = a.titleFontSize;

    const axis: Record<string, unknown> = {};
    if (has(a.id)) axis.id = a.id;
    if (has(a.type)) axis.type = a.type;
    if (has(a.position)) axis.position = a.position;
    if (a.display !== undefined) axis.display = a.display;
    if (a.stacked !== undefined) axis.stacked = a.stacked;
    if (a.time) axis.time = a.time;
    if (Object.keys(ticks).length) axis.ticks = ticks;
    if (Object.keys(gridLines).length) axis.gridLines = gridLines;
    if (Object.keys(scaleLabel).length) axis.scaleLabel = scaleLabel;
    return axis;
}
