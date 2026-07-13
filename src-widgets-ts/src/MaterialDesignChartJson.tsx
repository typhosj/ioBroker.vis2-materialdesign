import React from "react";
import type { RxWidgetInfo, VisRxWidgetState } from "@iobroker/types-vis-2";
import { colorSchemes, scheme } from "./MaterialDesignColorScheme";
import { MaterialDesignChartCanvas } from "./MaterialDesignChartCanvas";
import { RenderProps, VisWidget, createInfo, stateValue } from "./widgetUtils";

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
  v === undefined || v === null || v === "" || v === "null" ? d : String(v);
const n = (v: unknown, d = 0) =>
  v === undefined || v === null || v === "" || !Number.isFinite(Number(v))
    ? d
    : Number(v);
const b = (v: unknown, d = false) =>
  v === undefined || v === null || v === ""
    ? d
    : v === true || v === "true" || v === 1 || v === "1";
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
      visPrev:
        '<img src="widgets/materialdesign/img/prev_json_chart.png"></img>',
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
        s(stateValue(this.state as VisRxWidgetState, s(data.oid))),
      );
    } catch {
      /* render error below */
    }
    const graphs = input?.graphs || [];
    const labels = input?.axisLabels || [];
    const values = graphs.flatMap((graph) =>
      (graph.data || []).map((value) =>
        typeof value === "object" && value
          ? n((value as { y?: unknown }).y)
          : n(value),
      ),
    );
    const min = Math.min(0, ...values),
      max = Math.max(1, ...values),
      range = Math.max(1, max - min);
    const palette = s(data.colorScheme)
      ? scheme(s(data.colorScheme), graphs.length)
      : [];
    const W = 1000,
      H = 600,
      l = 70 + n(data.chartPaddingLeft),
      r = 25 + n(data.chartPaddingRight),
      t = 30 + n(data.chartPaddingTop),
      bottom = 70 + n(data.chartPaddingBottom),
      aw = W - l - r,
      ah = H - t - bottom,
      count = Math.max(
        1,
        labels.length,
        ...graphs.map((graph) => graph.data?.length || 0),
      );
    const x = (i: number) => l + aw * (count === 1 ? 0.5 : i / (count - 1));
    const y = (v: number) => t + ah * (1 - (v - min) / range);
    const grid = Array.from({ length: 6 }, (_, i) => (
      <line
        key={i}
        x1={l}
        x2={l + aw}
        y1={t + (ah * i) / 5}
        y2={t + (ah * i) / 5}
        stroke={s(data.xAxisGridLinesColor, "#ddd")}
      />
    ));
    const chart = (
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{
          background: s(data.chartAreaBackgroundColor),
          flex: 1,
          height: "100%",
          minHeight: 0,
          width: "100%",
        }}
      >
        {grid}
        {graphs.map((graph, gi) => {
          const points = (graph.data || []).map((raw, i) => ({
            x: x(i),
            y: y(
              typeof raw === "object" && raw
                ? n((raw as { y?: unknown }).y)
                : n(raw),
            ),
            value:
              typeof raw === "object" && raw
                ? n((raw as { y?: unknown }).y)
                : n(raw),
          }));
          const c = s(
            graph.color,
            palette[gi] || s(data.globalColor, "#44739e"),
          );
          if (s(graph.type, s(data.chartType, "bar")) === "bar")
            return (
              <g key={gi}>
                {points.map((point, i) => (
                  <rect
                    key={i}
                    x={
                      point.x -
                      aw / count / graphs.length / 2 +
                      (gi * aw) / count / graphs.length
                    }
                    y={point.y}
                    width={
                      ((aw / count / graphs.length) * n(data.barWidth, 80)) /
                      100
                    }
                    height={t + ah - point.y}
                    fill={c}
                    stroke={s(graph.barBorderColor)}
                    strokeWidth={n(graph.barBorderWidth)}
                  >
                    <title>{`${graph.legendText || ""}: ${point.value}`}</title>
                  </rect>
                ))}
              </g>
            );
          const path = points
            .map((point, i) => {
              const previous = points[i - 1];
              return `${i ? b(graph.line_steppedLine) ? `L${point.x} ${previous.y} L` : "L" : "M"}${point.x} ${point.y}`;
            })
            .join(" ");
          return (
            <g key={gi}>
              {b(graph.line_UseFillColor) ? (
                <path
                  d={`${path} L${points[points.length - 1]?.x || l} ${t + ah} L${points[0]?.x || l} ${t + ah} Z`}
                  fill={s(graph.line_FillColor, `${c}33`)}
                />
              ) : null}
              <path
                d={path}
                fill="none"
                stroke={c}
                strokeWidth={n(graph.line_Thickness, 2)}
              />
              {points.map((point, i) => (
                <circle
                  key={i}
                  cx={point.x}
                  cy={point.y}
                  r={n(graph.line_pointSize, 3)}
                  fill={s(graph.line_PointColor, c)}
                >
                  <title>{`${graph.legendText || ""}: ${point.value}`}</title>
                </circle>
              ))}
              {points.map((point, i) =>
                b(graph.datalabel_show, true) && i % Math.max(1, n(graph.datalabel_steps, 1)) === 0 ? (
                  <text key={`label-${i}`} x={point.x} y={point.y - n(graph.datalabel_fontSize, 14) / 2} fill={s(graph.datalabel_color, c)} fontFamily={s(graph.datalabel_fontFamily)} fontSize={n(graph.datalabel_fontSize, 14)} textAnchor="middle">{`${point.value.toFixed(Math.max(0, n(graph.datalabel_maxDigits)))}${s(graph.datalabel_append)}`}</text>
                ) : null,
              )}
            </g>
          );
        })}
        {labels.map((label, i) => (
          <text
            key={i}
            x={x(i)}
            y={t + ah + 25}
            fill={s(data.xAxisValueLabelColor, "#333")}
            textAnchor="middle"
          >
            {label}
          </text>
        ))}
      </svg>
    );
    const legend = b(data.showLegend, true) ? (
      <div
        style={{
          display: "flex",
          flexDirection: ["top", "bottom"].includes(s(data.legendPosition))
            ? "row"
            : "column",
          flexWrap: "wrap",
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
    const chartjs = <MaterialDesignChartCanvas type={s(data.chartType, "bar")} data={{ labels, datasets: graphs.map((graph, i) => ({ type: s(graph.type, s(data.chartType, "bar")), label: s(graph.legendText), data: (graph.data || []).map(value => typeof value === "object" && value ? n((value as { y?: unknown }).y) : n(value)), borderColor: s(graph.color, palette[i] || s(data.globalColor, "#44739e")), backgroundColor: b(graph.line_UseFillColor) ? s(graph.line_FillColor, `${s(graph.color, palette[i] || s(data.globalColor, "#44739e"))}33`) : s(graph.color, palette[i] || s(data.globalColor, "#44739e")), borderWidth: n(graph.line_Thickness, n(graph.barBorderWidth, 2)), steppedLine: b(graph.line_steppedLine), fill: b(graph.line_UseFillColor), yAxisID: `yAxis_id_${n((graph as Record<string, unknown>).yAxis_id, i)}`, stack: b(graph.barIsStacked) ? n((graph as Record<string, unknown>).barStackId, 0) : undefined })) }} options={{ animation: { duration: n(data.animationDuration, 1000) }, legend: { display: b(data.showLegend, true) }, tooltips: { enabled: b(data.showTooltip, true) }, scales: { yAxes: graphs.map((graph, i) => ({ id: `yAxis_id_${n((graph as Record<string, unknown>).yAxis_id, i)}`, position: s((graph as Record<string, unknown>).yAxis_position, "left"), stacked: b(graph.barIsStacked), ticks: { min: n((graph as Record<string, unknown>).yAxis_min, undefined as unknown as number), max: n((graph as Record<string, unknown>).yAxis_max, undefined as unknown as number) } })) } }} />;
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
              dangerouslySetInnerHTML={{ __html: s(data.title) }}
            />
            {chartjs}
            {legend}
          </div>
        ) : (
          <>
            {chartjs}
            {legend}
          </>
        )}
      </div>
    );
  }
}
