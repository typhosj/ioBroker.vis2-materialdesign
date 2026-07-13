import React from "react";
import type { RxWidgetInfo, VisRxWidgetState } from "@iobroker/types-vis-2";
import { colorSchemes, scheme } from "./MaterialDesignColorScheme";
import { MaterialDesignChartCanvas } from "./MaterialDesignChartCanvas";
import { RenderProps, VisWidget, createInfo, stateValue } from "./widgetUtils";

type Data = Record<string, unknown> & {
  oid?: string;
  dataCount?: number;
  chartDataMethod?: string;
};
const s = (v: unknown, d = ""): string =>
  v === undefined || v === null || v === "" || v === "null" ? d : String(v);
const n = (v: unknown, d = 0): number =>
  v === undefined || v === null || v === "" || !Number.isFinite(Number(v))
    ? d
    : Number(v);
const b = (v: unknown, d = false): boolean =>
  v === undefined || v === null || v === ""
    ? d
    : v === true || v === "true" || v === 1 || v === "1";
function readJson(value: unknown): Record<string, unknown>[] | null {
  try {
    const result: unknown = JSON.parse(s(value));
    return Array.isArray(result) ? (result as Record<string, unknown>[]) : null;
  } catch {
    return null;
  }
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
      {
        name: "chartDataMethod",
        label: "chartDataMethod",
        type: "select",
        options: ["inputPerEditor", "jsonStringObject"],
        default: "inputPerEditor",
      },
      { name: "dataCount", label: "dataCount", type: "number", default: 1 },
      { name: "oid", label: "oid", type: "id" },
      {
        name: "chartType",
        label: "chartType",
        type: "select",
        options: ["pie", "doughnut"],
        default: "pie",
      },
      {
        name: "doughnutCutOut",
        label: "doughnutCutOut",
        type: "slider",
        min: 0,
        max: 100,
        step: 1,
      },
      ...[
        "chartPaddingTop",
        "chartPaddingLeft",
        "chartPaddingRight",
        "chartPaddingBottom",
      ].map(number),
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
        name: "disableHoverEffects",
        label: "disableHoverEffects",
        type: "checkbox",
      },
      number("animationDuration"),
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
    name: "oids",
    label: "group_oids",
    indexFrom: 0,
    indexTo: "dataCount",
    hidden: (data: Data) =>
      s(data.chartDataMethod, "inputPerEditor") !== "inputPerEditor",
    fields: [{ name: "oid", label: "oid", type: "id" }],
  },
  {
    name: "pieLayout",
    label: "group_pieLayout",
    fields: [
      {
        name: "colorScheme",
        label: "colorScheme",
        type: "select",
        options: Object.keys(colorSchemes),
      },
      color("globalColor"),
      color("hoverColor"),
      color("borderColor"),
      color("hoverBorderColor"),
      number("borderWidth"),
      number("hoverBorderWidth"),
    ],
  },
  {
    name: "layoutForData",
    label: "group_layoutForData",
    indexFrom: 0,
    indexTo: "dataCount",
    hidden: (data: Data) =>
      s(data.chartDataMethod, "inputPerEditor") !== "inputPerEditor",
    fields: [
      color("dataColor"),
      { name: "label", label: "label", type: "text" },
      color("valueTextColor"),
      { name: "labelValueAppend", label: "labelValueAppend", type: "text" },
      { name: "tooltipTitle", label: "tooltipTitle", type: "text" },
      { name: "tooltipText", label: "tooltipText", type: "text" },
    ],
  },
  {
    name: "pieValuesLayout",
    label: "group_pieValuesLayout",
    fields: [
      {
        name: "showValues",
        label: "showValues",
        type: "select",
        options: ["showValuesOn", "showValuesOff", "showValuesAuto"],
        default: "showValuesOn",
      },
      number("valuesSteps"),
      number("valuesMinDecimals"),
      number("valuesMaxDecimals"),
      { name: "valuesAppendText", label: "valuesAppendText", type: "text" },
      color("valuesFontColor"),
      { name: "valuesFontFamily", label: "valuesFontFamily", type: "fontname" },
      number("valuesFontSize"),
      {
        name: "valuesPositionAnchor",
        label: "valuesPositionAnchor",
        type: "select",
        options: ["center", "start", "end"],
        default: "center",
      },
      {
        name: "valuesPositionAlign",
        label: "valuesPositionAlign",
        type: "select",
        options: ["center", "start", "end", "right", "bottom", "left", "top"],
        default: "end",
      },
      number("valuesPositionOffset"),
      {
        name: "valuesTextAlign",
        label: "valuesTextAlign",
        type: "select",
        options: ["start", "center", "end", "left", "right"],
        default: "center",
      },
      {
        name: "valuesRotation",
        label: "valuesRotation",
        type: "slider",
        min: 0,
        max: 360,
        step: 1,
      },
    ],
  },
  {
    name: "legendLayout",
    label: "group_legendLayout",
    fields: [
      { name: "showLegend", label: "showLegend", type: "checkbox" },
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
      color("tooltipBackgroundColor"),
      number("tooltipArrowSize"),
      number("tooltipDistanceToBar"),
      number("tooltipBoxRadius"),
      {
        name: "tooltipShowColorBox",
        label: "tooltipShowColorBox",
        type: "checkbox",
        default: true,
      },
      number("tooltipXpadding"),
      number("tooltipYpadding"),
      color("tooltipTitleFontColor"),
      {
        name: "tooltipTitleFontFamily",
        label: "tooltipTitleFontFamily",
        type: "fontname",
      },
      number("tooltipTitleFontSize"),
      number("tooltipTitleMarginBottom"),
      color("tooltipBodyFontColor"),
      {
        name: "tooltipBodyFontFamily",
        label: "tooltipBodyFontFamily",
        type: "fontname",
      },
      number("tooltipBodyFontSize"),
      { name: "tooltipBodyAppend", label: "tooltipBodyAppend", type: "text" },
      number("tooltipValueMinDecimals"),
      number("tooltipValueMaxDecimals"),
    ],
  },
];
export default class MaterialDesignChartPie extends VisWidget {
  static getWidgetInfo(): RxWidgetInfo {
    return {
      ...createInfo("tplVis2-materialdesign-Chart-Pie", "Pie Chart", attrs),
      visPrev: '<img src="widgets/materialdesign/img/pie_chart.png"></img>',
      visDefaultStyle: { width: 400, height: 270 },
    };
  }
  getWidgetInfo(): RxWidgetInfo {
    return MaterialDesignChartPie.getWidgetInfo();
  }
  renderWidgetBody(props: RenderProps): React.JSX.Element {
    super.renderWidgetBody(props);
    const data = this.state.rxData as unknown as Data;
    const json =
      s(data.chartDataMethod) === "jsonStringObject"
        ? readJson(stateValue(this.state as VisRxWidgetState, s(data.oid)))
        : null;
    const count = json
      ? json.length
      : Math.max(1, Math.floor(n(data.dataCount, 1)) + 1);
    const colors = s(data.colorScheme)
      ? scheme(s(data.colorScheme), count)
      : [];
    const values = Array.from({ length: count }, (_, i) => {
      const item = json?.[i];
      const value = n(
        item?.value,
        n(stateValue(this.state as VisRxWidgetState, s(data[`oid${i}`]))),
      );
      return {
        label: s(item?.label, s(data[`label${i}`])),
        value: Math.max(0, value),
        color: s(
          item?.dataColor,
          s(data[`dataColor${i}`], colors[i] || s(data.globalColor, "#44739e")),
        ),
        textColor: s(
          item?.valueColor,
          s(data[`valueTextColor${i}`], s(data.valuesFontColor, "#000")),
        ),
        appendix: s(
          item?.valueAppendix,
          s(data[`labelValueAppend${i}`], s(data.valuesAppendText)),
        ),
      };
    });
    const total = Math.max(
      1,
      values.reduce((sum, item) => sum + item.value, 0),
    );
    const radius = 180,
      inner =
        s(data.chartType, "pie") === "doughnut"
          ? (radius * Math.max(0, Math.min(100, n(data.doughnutCutOut, 50)))) /
            100
          : 0;
    let angle = -Math.PI / 2;
    const arc = (start: number, end: number): string => {
      const a = [
          500 + radius * Math.cos(start),
          300 + radius * Math.sin(start),
        ],
        z = [500 + radius * Math.cos(end), 300 + radius * Math.sin(end)],
        large = end - start > Math.PI ? 1 : 0;
      if (!inner)
        return `M500 300 L${a[0]} ${a[1]} A${radius} ${radius} 0 ${large} 1 ${z[0]} ${z[1]} Z`;
      const ai = [500 + inner * Math.cos(end), 300 + inner * Math.sin(end)],
        zi = [500 + inner * Math.cos(start), 300 + inner * Math.sin(start)];
      return `M${a[0]} ${a[1]} A${radius} ${radius} 0 ${large} 1 ${z[0]} ${z[1]} L${ai[0]} ${ai[1]} A${inner} ${inner} 0 ${large} 0 ${zi[0]} ${zi[1]} Z`;
    };
    const pieces = values.map((item, i) => {
      const start = angle,
        end = (angle += (item.value / total) * Math.PI * 2),
        mid = (start + end) / 2,
        labelRadius = inner ? (radius + inner) / 2 : radius * 0.62;
      return (
        <g key={i}>
          <path
            d={arc(start, end)}
            fill={item.color}
            stroke={s(data.borderColor, "#fff")}
            strokeWidth={n(data.borderWidth, 1)}
          >
            <title>{`${item.label}: ${item.value}${item.appendix}`}</title>
          </path>
          {s(data.showValues, "showValuesOn") !== "showValuesOff" && i % Math.max(1, n(data.valuesSteps, 1)) === 0 ? (
            <text
              x={500 + labelRadius * Math.cos(mid)}
              y={300 + labelRadius * Math.sin(mid)}
              fill={item.textColor}
              fontFamily={s(data.valuesFontFamily)}
              fontSize={n(data.valuesFontSize, 18)}
              textAnchor="middle"
            >{`${item.value.toLocaleString(undefined, { minimumFractionDigits: Math.max(0, n(data.valuesMinDecimals)), maximumFractionDigits: Math.max(0, n(data.valuesMaxDecimals)) })}${item.appendix}`}</text>
          ) : null}
        </g>
      );
    });
    const legend = b(data.showLegend) ? (
      <div
        style={{
          display: "flex",
          flexDirection: ["top", "bottom"].includes(s(data.legendPosition))
            ? "row"
            : "column",
          flexWrap: "wrap",
          fontFamily: s(data.legendFontFamily),
          fontSize: n(data.legendFontSize, 14),
          gap: n(data.legendPadding, 8),
          padding: n(data.legendDistanceToChart),
        }}
      >
        {values.map((item, i) => (
          <span
            key={i}
            style={{
              alignItems: "center",
              color: s(data.legendFontColor),
              display: "flex",
            }}
          >
            <i
              style={{
                background: item.color,
                borderRadius: b(data.legendPointStyle, true) ? "50%" : 0,
                display: "inline-block",
                height: n(data.legendBoxWidth, 10),
                marginRight: 4,
                width: n(data.legendBoxWidth, 10),
              }}
            />
            {item.label}
          </span>
        ))}
      </div>
    ) : null;
    const chart = (
      <svg
        viewBox="0 0 1000 600"
        preserveAspectRatio="xMidYMid meet"
        style={{
          background: s(data.chartAreaBackgroundColor),
          flex: 1,
          height: "100%",
          minHeight: 0,
          width: "100%",
        }}
      >
        {pieces}
      </svg>
    );
    const chartjs = <MaterialDesignChartCanvas type={s(data.chartType, "pie")} data={{ labels: values.map(item => item.label), datasets: [{ data: values.map(item => item.value), backgroundColor: values.map(item => item.color), borderColor: s(data.borderColor, "#fff"), borderWidth: n(data.borderWidth, 1) }] }} options={{ animation: { duration: n(data.animationDuration, 1000) }, cutoutPercentage: s(data.chartType) === "doughnut" ? n(data.doughnutCutOut, 50) : 0, legend: { display: false }, tooltips: { enabled: b(data.showTooltip, true) } }} />;
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
        {b(data.cardUse) ? (
          <div
            className="materialdesign-html-card-container mdc-card"
            style={{
              background: s(data.colorBackground),
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              height: "100%",
              padding: n(data.borderDistance, 8),
              width: "100%",
            }}
          >
            <div
              className="card-title-section"
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
