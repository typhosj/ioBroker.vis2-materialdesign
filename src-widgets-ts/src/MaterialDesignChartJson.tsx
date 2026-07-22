import React from "react";
import { squarePreview , RenderProps, VisWidget, createInfo, stateValue, sanitizeHtml } from './widgetUtils';
import type { RxWidgetInfo } from "@iobroker/types-vis-2";
import { colorSchemes, scheme } from "./MaterialDesignColorScheme";
import { MaterialDesignChartCanvas } from "./MaterialDesignChartCanvas";
import { chartAxis } from "./chartAxis";

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
const s = (v: unknown, d = "") =>
  v === undefined || v === null || v === "" || v === "null" ? d : typeof v === "string" ? v : typeof v === "number" || typeof v === "boolean" || typeof v === "bigint" ? String(v) : d;
const n = (v: unknown, d = 0) =>
  v === undefined || v === null || v === "" || !Number.isFinite(Number(v))
    ? d
    : Number(v);
// like n() but yields undefined (not 0) for empty/invalid, so an unset
// axis min/max stays auto-scaling instead of collapsing the axis to 0.
const optN = (v: unknown): number | undefined =>
  v === undefined || v === null || v === "" || !Number.isFinite(Number(v))
    ? undefined
    : Number(v);
const b = (v: unknown, d = false) =>
  v === undefined || v === null || v === ""
    ? d
    : v === true || v === "true" || v === 1 || v === "1";
export const jsonChartValue = (raw: unknown): number | null => {
  const value = typeof raw === "object" && raw ? (raw as { y?: unknown }).y : raw;
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
export function jsonChartSegments<T>(points: Array<T | null>, spanGaps: boolean): T[][] {
  if (spanGaps) {
    const segment = points.filter((point): point is T => point !== null);
    return segment.length ? [segment] : [];
  }
  const segments: T[][] = [];
  let current: T[] | null = null;
  for (const point of points) {
    if (point === null) {
      current = null;
      continue;
    }
    if (!current) {
      current = [];
      segments.push(current);
    }
    current.push(point);
  }
  return segments;
}
const color = (name: string) => ({ name, label: name, type: "color" as const });
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
      { name: "debug", label: "debug", type: "checkbox" },
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
    ],
  },
];
export default class MaterialDesignChartJson extends VisWidget {
  static getWidgetInfo(): RxWidgetInfo {
    return {
      ...createInfo("tplVis2-materialdesign-Chart-JSON", "JSON Chart", attrs),
      visPrev: squarePreview('F154E'),
      visDefaultStyle: { width: 400, height: 270 },
    };
  }
  getWidgetInfo(): RxWidgetInfo {
    return MaterialDesignChartJson.getWidgetInfo();
  }
  renderWidgetBody(props: RenderProps): React.JSX.Element {
    super.renderWidgetBody(props);
    const data = this.state.rxData as unknown as Data;
    let input: { axisLabels?: string[]; graphs?: Graph[] } | null = null;
    try {
      input = JSON.parse(
        s(stateValue(this.state, s(data.oid))),
      );
    } catch {
      /* render error below */
    }
    const graphs = input?.graphs || [];
    const labels = input?.axisLabels || [];
    const palette = s(data.colorScheme)
      ? scheme(s(data.colorScheme), graphs.length)
      : [];
    const legend = b(data.showLegend, true) ? (
      <div
        style={{
          display: "flex",
          flexDirection: ["top", "bottom"].includes(s(data.legendPosition))
            ? "row"
            : "column",
          flexWrap: "wrap",
          flexShrink: 0,
          gap: n(data.legendPadding, 8),
          padding: n(data.legendDistanceToChart),
          fontFamily: s(data.legendFontFamily),
          fontSize: n(data.legendFontSize, 14),
        }}
      >
        {graphs.map((graph, i) => (
          <span key={i} style={{ color: s(data.legendFontColor) }}>
            <i
              style={{
                background: s(
                  graph.color,
                  palette[i] || s(data.globalColor, "#44739e"),
                ),
                display: "inline-block",
                height: n(data.legendBoxWidth, 10),
                marginRight: 4,
                width: n(data.legendBoxWidth, 10),
              }}
            />
            {s(graph.legendText)}
          </span>
        ))}
      </div>
    ) : null;
    // unset yAxis_id -> id 0, so all graphs share one y-axis instead of
    // each graph getting its own axis by index.
    const axisId = (graph: Graph) => `yAxis_id_${n((graph as Record<string, unknown>).yAxis_id, 0)}`;
    // one axis config per distinct id (dedupe; else duplicate axis ids).
    const yAxes = graphs
      .filter((graph, i) => graphs.findIndex(g => axisId(g) === axisId(graph)) === i)
      .map(graph => chartAxis({
        id: axisId(graph), type: "linear",
        display: b(data.yAxisShowAxis, true),
        position: s((graph as Record<string, unknown>).yAxis_position, s(data.yAxisPosition, "left")),
        stacked: b(graph.barIsStacked),
        title: s(data.yAxisTitle), titleColor: s(data.yAxisTitleColor),
        labelColor: s(data.yAxisValueLabelColor),
        min: optN((graph as Record<string, unknown>).yAxis_min), max: optN((graph as Record<string, unknown>).yAxis_max),
      }));
    const xAxes = [chartAxis({
      display: b(data.xAxisShowAxis, true),
      position: s(data.xAxisPosition, "bottom"),
      title: s(data.xAxisTitle), titleColor: s(data.xAxisTitleColor),
      labelColor: s(data.xAxisValueLabelColor),
      gridDisplay: b(data.xAxisShowGridLines, true),
      gridColor: s(data.xAxisGridLinesColor),
    })];
    const chartjs = <MaterialDesignChartCanvas type={s(data.chartType, "bar")} data={{ labels, datasets: graphs.map((graph, i) => ({ type: s(graph.type, s(data.chartType, "bar")), label: s(graph.legendText), data: (graph.data || []).map(jsonChartValue), borderColor: s(graph.color, palette[i] || s(data.globalColor, "#44739e")), backgroundColor: b(graph.line_UseFillColor) ? s(graph.line_FillColor, `${s(graph.color, palette[i] || s(data.globalColor, "#44739e"))}33`) : s(graph.color, palette[i] || s(data.globalColor, "#44739e")), borderWidth: n(graph.line_Thickness, n(graph.barBorderWidth, 2)), steppedLine: b(graph.line_steppedLine), spanGaps: b(graph.line_spanGaps, true), fill: b(graph.line_UseFillColor), yAxisID: axisId(graph), stack: b(graph.barIsStacked) ? n((graph as Record<string, unknown>).barStackId, 0) : undefined })) }} options={{ responsive: true, maintainAspectRatio: false, animation: { duration: n(data.animationDuration, 1000) }, legend: { display: false }, tooltips: { enabled: b(data.showTooltip, true) }, scales: { xAxes, yAxes } }} />;
    // keep the canvas from eating the whole flex box (else legend spills
    // outside the widget frame); shrink chart, keep legend natural size.
    const chartBox = (
      <div style={{ flex: 1, minWidth: 0, minHeight: 0, position: "relative" }}>{chartjs}</div>
    );
    // top/left -> legend before chart; bottom/right -> after.
    const legendFirst = ["top", "left"].includes(s(data.legendPosition, "right"));
    const body = legendFirst ? (
      <>{legend}{chartBox}</>
    ) : (
      <>{chartBox}{legend}</>
    );
    return (
      <div
        className="materialdesign-widget materialdesign-chart"
        style={{
          background: s(data.backgroundColor),
          display: "flex",
          flexDirection: ["top", "bottom"].includes(s(data.legendPosition))
            ? "column"
            : "row",
          height: "100%",
          width: "100%",
        }}
      >
        {!input ? (
          <span style={{ color: "red" }}>Error in JSON string</span>
        ) : b(data.cardUse) ? (
          <div
            className="materialdesign-html-card-container mdc-card"
            style={{
              background: s(data.colorBackground),
              display: "flex",
              flexDirection: "column",
              height: "100%",
              padding: n(data.borderDistance, 8),
              width: "100%",
            }}
          >
            <div
              style={{
                background: s(data.colorTitleSectionBackground),
                color: s(data.colorTitle),
                fontFamily: s(data.titleFontFamily),
              }}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(s(data.title)) }}
            />
            {body}
          </div>
        ) : (
          body
        )}
      </div>
    );
  }
}
