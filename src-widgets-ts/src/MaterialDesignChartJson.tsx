import { squarePreview, createInfo, designStyle, boolValue as b, numberValue as n, textValue as s } from './widgetUtils';
import type { RxWidgetInfo } from "@iobroker/types-vis-2";
import { colorSchemes } from "./MaterialDesignColorScheme";
import { ChartWidget, type ChartSpec } from "./MaterialDesignChartCanvas";
import { chartAxis, m3ChartColors } from "./chartAxis";

type Graph = {
  data?: unknown[];
  type?: string;
  color?: string;
  legendText?: string;
  line_Thickness?: number;
  line_pointSize?: number;
  line_UseFillColor?: boolean;
  line_FillColor?: string;
  line_steppedLine?: boolean;
  line_PointColor?: string;
  line_spanGaps?: boolean;
  barBorderColor?: string;
  barBorderWidth?: number;
  barIsStacked?: boolean;
  datalabel_show?: boolean | "auto";
  datalabel_steps?: number;
  datalabel_minDigits?: number;
  datalabel_maxDigits?: number;
  datalabel_append?: string;
  datalabel_color?: string;
  datalabel_fontFamily?: string;
  datalabel_fontSize?: number;
};
type Data = Record<string, unknown> & { oid?: string };
// Yields undefined (not 0) for empty/invalid, so an unset axis min/max stays auto-scaling.
const optN = (v: unknown): number | undefined =>
  v === undefined || v === null || v === "" || !Number.isFinite(Number(v))
    ? undefined
    : Number(v);
// An empty state is not a broken JSON string: it is the normal situation right after a page load,
// before the first subscription value arrives (and in the editor before an oid is picked). Parsing
// "" threw there and the widget rendered its red error text for a few hundred milliseconds on every
// load. Same rule as MaterialDesignAlerts. null means "really broken", and only that shows the error.
export function chartJsonInput(raw: unknown): { axisLabels?: string[]; graphs?: Graph[] } | null {
  if (s(raw) === "") return {};
  try {
    return JSON.parse(s(raw)) as { axisLabels?: string[]; graphs?: Graph[] };
  } catch {
    return null;
  }
}
export const jsonChartValue = (raw: unknown): number | null => {
  const value = typeof raw === "object" && raw ? (raw as { y?: unknown }).y : raw;
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
export function graphAxisId(graph: Graph): string {
  return `yAxis_id_${n((graph as Record<string, unknown>).yAxis_id, 0)}`;
}
export function distinctAxisGraphs(graphs: Graph[]): Graph[] {
  return graphs.filter((graph, i) => graphs.findIndex(g => graphAxisId(g) === graphAxisId(graph)) === i);
}
const color = (name: string) => ({ name, label: name, type: "color" as const });
const num = (name: string) => ({ name, label: name, type: "number" as const });
const number = (name: string) => ({
  name,
  label: name,
  type: "number" as const,
});
const attrs: RxWidgetInfo["visAttrs"] = [
  {
    name: "common",
    fields: [
      { name: "oid", label: "oid", type: "id" },
      {
        name: "chartType",
        label: "chartType",
        type: "select",
        options: ["bar", "line"],
        default: "bar",
      },
    ],
  },
  {
    name: "chartLayout",
    label: "group_chartLayout",
    fields: [
      color("backgroundColor"),
      color("chartAreaBackgroundColor"),
      {
        name: "colorScheme",
        label: "colorScheme",
        type: "select",
        options: Object.keys(colorSchemes),
      },
      color("globalColor"),
      {
        name: "disableHoverEffects",
        label: "disableHoverEffects",
        type: "checkbox",
      },
      ...[
        "chartPaddingTop",
        "chartPaddingLeft",
        "chartPaddingRight",
        "chartPaddingBottom",
        "animationDuration",
      ].map(number),
    ],
  },
  {
    name: "card",
    label: "group_listItemCardBackground",
    fields: [
      { name: "cardUse", label: "cardUse", type: "checkbox" },
      { name: "title", label: "title", type: "html" },
      { name: "titleLayout", label: "titleLayout", type: "text" },
      number("borderDistance"),
      { name: "titleFontFamily", label: "titleFontFamily", type: "fontname" },
      color("colorBackground"),
      color("colorTitleSectionBackground"),
      color("colorTextSectionBackground"),
      color("colorTitle"),
    ],
  },
  {
    name: "barLayout",
    label: "group_barLayout",
    fields: [
      {
        name: "barWidth",
        label: "barWidth",
        type: "slider",
        min: 0,
        max: 100,
        step: 1,
        default: 80,
      },
    ],
  },
  {
    name: "legendLayout",
    label: "group_legendLayout",
    fields: [
      {
        name: "showLegend",
        label: "showLegend",
        type: "checkbox",
        default: true,
      },
      {
        name: "legendPosition",
        label: "legendPosition",
        type: "select",
        options: ["top", "left", "bottom", "right"],
        default: "right",
      },
      color("legendFontColor"),
      { name: "legendFontFamily", label: "legendFontFamily", type: "fontname" },
      number("legendFontSize"),
      {
        name: "legendBoxWidth",
        label: "legendBoxWidth",
        type: "slider",
        min: 0,
        max: 100,
        step: 1,
      },
      {
        name: "legendPointStyle",
        label: "legendPointStyle",
        type: "checkbox",
        default: true,
      },
      number("legendDistanceToChart"),
      number("legendPadding"),
    ],
  },
  {
    name: "tooltipLayout",
    label: "group_tooltipLayout",
    fields: [
      {
        name: "showTooltip",
        label: "showTooltip",
        type: "checkbox",
        default: true,
      },
      {
        name: "tooltipMode",
        label: "tooltipMode",
        type: "select",
        options: ["nearest", "point", "index", "dataset", "x", "y"],
        default: "nearest",
      },
      {
        name: "tooltipPosition",
        label: "tooltipPosition",
        type: "select",
        options: ["average", "nearest"],
        default: "nearest",
      },
      color("tooltipBackgroundColor"),
      color("tooltipTitleFontColor"),
      color("tooltipBodyFontColor"),
      // tooltipConfig() has always read these - the JSON chart just never offered them, so its
      // tooltip stayed on the chart.js defaults and the theme button wrote into nothing.
      { name: "tooltipTitleFontFamily", label: "tooltipTitleFontFamily", type: "fontname" as const },
      { name: "tooltipTitleFontSize", label: "tooltipTitleFontSize", type: "number" as const },
      { name: "tooltipBodyFontFamily", label: "tooltipBodyFontFamily", type: "fontname" as const },
      { name: "tooltipBodyFontSize", label: "tooltipBodyFontSize", type: "number" as const },
      { name: "tooltipShowColorBox", label: "tooltipShowColorBox", type: "checkbox" as const, default: true },
      num("tooltipArrowSize"),
      num("tooltipDistanceToBar"),
      num("tooltipBoxRadius"),
      num("tooltipXpadding"),
      num("tooltipYpadding"),
      num("tooltipTitleMarginBottom"),
      {
        name: "tooltipBodyAlignment",
        label: "tooltipBodyAlignment",
        type: "select",
        options: ["left", "center", "right"],
        default: "left",
      },
    ],
  },
  {
    name: "xAxisLayout",
    label: "group_xAxisLayout",
    fields: [
      {
        name: "xAxisPosition",
        label: "xAxisPosition",
        type: "select",
        options: ["top", "bottom"],
        default: "bottom",
      },
      { name: "xAxisTitle", label: "xAxisTitle", type: "text" },
      color("xAxisTitleColor"),
      color("xAxisValueLabelColor"),
      {
        name: "xAxisShowAxis",
        label: "xAxisShowAxis",
        type: "checkbox",
        default: true,
      },
      {
        name: "xAxisShowGridLines",
        label: "xAxisShowGridLines",
        type: "checkbox",
        default: true,
      },
      color("xAxisGridLinesColor"),
      {
        name: "xAxisOffsetGridLines",
        label: "xAxisOffsetGridLines",
        type: "checkbox",
      },
    ],
  },
  {
    name: "barValuesLayout",
    label: "group_barValuesLayout",
    fields: [
      {
        name: "showValues",
        label: "showValues",
        type: "select",
        options: ["showValuesOn", "showValuesOff", "showValuesAuto"],
        default: "showValuesOff",
      },
      { name: "valuesSteps", label: "valuesSteps", type: "number" },
      { name: "valuesMinDecimals", label: "valuesMinDecimals", type: "number" },
      { name: "valuesMaxDecimals", label: "valuesMaxDecimals", type: "number" },
      { name: "valuesAppendText", label: "valuesAppendText", type: "text" },
      { name: "valuesFontColor", label: "valuesFontColor", type: "color" },
      { name: "valuesFontFamily", label: "valuesFontFamily", type: "fontname" },
      { name: "valuesFontSize", label: "valuesFontSize", type: "number" },
    ],
  },
  {
    name: "yAxisLayout",
    label: "group_yAxisLayout",
    fields: [
      {
        name: "yAxisShowAxis",
        label: "yAxisShowAxis",
        type: "checkbox",
        default: true,
      },
      {
        name: "yAxisPosition",
        label: "yAxisPosition",
        type: "select",
        options: ["left", "right"],
        default: "left",
      },
      { name: "yAxisTitle", label: "yAxisTitle", type: "text" },
      color("yAxisTitleColor"),
      color("yAxisValueLabelColor"),
      {
        name: "yAxisShowGridLines",
        label: "yAxisShowGridLines",
        type: "checkbox",
        default: true,
      },
      color("yAxisGridLinesColor"),
    ],
  },
];
export default class MaterialDesignChartJson extends ChartWidget {
  static getWidgetInfo(): RxWidgetInfo {
    return {
      ...createInfo("tplVis2-materialdesign-Chart-JSON", "JSON Chart", attrs, ["card", "barValuesLayout", "legendLayout", "tooltipLayout", "xAxisLayout", "yAxisLayout"]),
      visPrev: squarePreview('F154E'),
      visDefaultStyle: { width: 400, height: 270 },
    };
  }
  getWidgetInfo(): RxWidgetInfo {
    return MaterialDesignChartJson.getWidgetInfo();
  }
  chartSpec(data: Data, value: (oid: unknown) => ioBroker.StateValue | undefined): ChartSpec {
    const isM3 = designStyle(data) === "material3";
    const m3 = m3ChartColors(this.isDarkTheme());
    const input = chartJsonInput(value(data.oid));
    const graphs = input?.graphs || [];
    // v4: scales are a keyed object (x + one entry per distinct y-axis id).
    const axisId = graphAxisId;
    const yEntries = distinctAxisGraphs(graphs).map((graph): [string, Record<string, unknown>] => [axisId(graph), chartAxis({
      axis: "y",
      type: "linear",
      display: b(data.yAxisShowAxis, true),
      position: s((graph as Record<string, unknown>).yAxis_position, s(data.yAxisPosition, "left")),
      stacked: b(graph.barIsStacked),
      title: s(data.yAxisTitle), titleColor: s(data.yAxisTitleColor, isM3 ? m3.text : ""),
      labelColor: s(data.yAxisValueLabelColor, isM3 ? m3.text : ""),
      gridDisplay: b(data.yAxisShowGridLines, true),
      gridColor: s(data.yAxisGridLinesColor, isM3 ? m3.grid : ""),
      min: optN((graph as Record<string, unknown>).yAxis_min), max: optN((graph as Record<string, unknown>).yAxis_max),
    })]);
    const xAxis = chartAxis({
      axis: "x",
      display: b(data.xAxisShowAxis, true),
      position: s(data.xAxisPosition, "bottom"),
      title: s(data.xAxisTitle), titleColor: s(data.xAxisTitleColor, isM3 ? m3.text : ""),
      labelColor: s(data.xAxisValueLabelColor, isM3 ? m3.text : ""),
      gridDisplay: b(data.xAxisShowGridLines, true),
      gridColor: s(data.xAxisGridLinesColor, isM3 ? m3.grid : ""),
      // On a category axis the lines otherwise run through the middle of a bar group; with the
      // offset they stand between the categories. Unset keeps the previous placement.
      gridOffset: data.xAxisOffsetGridLines === "" || data.xAxisOffsetGridLines === undefined ? undefined : b(data.xAxisOffsetGridLines),
    });
    const scales = { x: xAxis, ...Object.fromEntries(yEntries) };
    return {
      type: s(data.chartType, "bar"),
      colorBy: "dataset",
      labels: input?.axisLabels || [],
      datasets: graphs.map(graph => ({
        label: s(graph.legendText),
        values: (graph.data || []).map(jsonChartValue),
        colors: [s(graph.color) || undefined],
        extra: ([color]) => ({
          type: s(graph.type, s(data.chartType, "bar")),
          backgroundColor: b(graph.line_UseFillColor) ? s(graph.line_FillColor, `${color}33`) : color,
          borderWidth: n(graph.line_Thickness, n(graph.barBorderWidth, 2)),
          stepped: b(graph.line_steppedLine),
          spanGaps: b(graph.line_spanGaps, true),
          fill: b(graph.line_UseFillColor),
          barPercentage: data.barWidth === undefined || data.barWidth === "" ? undefined : Math.max(0, Math.min(1, n(data.barWidth, 80) / 100)),
          yAxisID: axisId(graph),
          stack: b(graph.barIsStacked) ? String(n((graph as Record<string, unknown>).barStackId, 0)) : undefined,
        }),
      })),
      scales,
      // Unset keeps the labels off: this widget drew none before the option group existed, and an
      // existing chart must not sprout them on upgrade.
      valueLabels: { align: "top", anchor: "end", show: "showValuesOff" },
      error: input ? undefined : "Error in JSON string",
    };
  }
}
