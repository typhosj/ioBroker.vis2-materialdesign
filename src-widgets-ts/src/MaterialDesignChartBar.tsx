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
type Bar = {
  label: string;
  value: number;
  color: string;
  valueText: string;
  valueColor: string;
  appendix: string;
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
const indexed = (data: Data, key: string, i: number): unknown =>
  data[`${key}${i}`];
function json(value: unknown): Record<string, unknown>[] | null {
  try {
    const result: unknown = JSON.parse(s(value));
    return Array.isArray(result) ? (result as Record<string, unknown>[]) : null;
  } catch {
    return null;
  }
}
const chartFields = [
  { name: "backgroundColor", label: "backgroundColor", type: "color" as const },
  {
    name: "chartAreaBackgroundColor",
    label: "chartAreaBackgroundColor",
    type: "color" as const,
  },
  {
    name: "disableHoverEffects",
    label: "disableHoverEffects",
    type: "checkbox" as const,
  },
  ...[
    "axisValueMin",
    "axisValueMax",
    "axisValueStepSize",
    "axisValueMinDigits",
    "axisValueMaxDigits",
    "axisMaxLabel",
    "animationDuration",
  ].map((name) => ({ name, label: name, type: "number" as const })),
  {
    name: "axisValueAppendText",
    label: "axisValueAppendText",
    type: "text" as const,
  },
  {
    name: "axisLabelAutoSkip",
    label: "axisLabelAutoSkip",
    type: "checkbox" as const,
  },
];
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
        options: ["vertical", "horizontal"],
        default: "vertical",
      },
      ...[
        "chartPaddingTop",
        "chartPaddingLeft",
        "chartPaddingRight",
        "chartPaddingBottom",
      ].map((name) => ({ name, label: name, type: "number" as const })),
      { name: "debug", label: "debug", type: "checkbox" },
    ],
  },
  { name: "chartLayout", label: "group_chartLayout", fields: chartFields },
  {
    name: "card",
    label: "group_listItemCardBackground",
    fields: [
      { name: "cardUse", label: "cardUse", type: "checkbox" },
      { name: "title", label: "title", type: "html" },
      { name: "titleLayout", label: "titleLayout", type: "text" },
      { name: "borderDistance", label: "borderDistance", type: "number" },
      { name: "titleFontFamily", label: "titleFontFamily", type: "fontname" },
      ...[
        "colorBackground",
        "colorTitleSectionBackground",
        "colorTextSectionBackground",
        "colorTitle",
      ].map((name) => ({ name, label: name, type: "color" as const })),
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
    name: "barLayout",
    label: "group_barLayout",
    fields: [
      { name: "barLabelText", label: "barLabelText", type: "text" },
      {
        name: "colorScheme",
        label: "colorScheme",
        type: "select",
        options: Object.keys(colorSchemes),
      },
      { name: "globalColor", label: "globalColor", type: "color" },
      { name: "hoverColor", label: "hoverColor", type: "color" },
      { name: "hoverBorderColor", label: "hoverBorderColor", type: "color" },
      { name: "hoverBorderWidth", label: "hoverBorderWidth", type: "number" },
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
    name: "layoutForData",
    label: "group_layoutForData",
    indexFrom: 0,
    indexTo: "dataCount",
    hidden: (data: Data) =>
      s(data.chartDataMethod, "inputPerEditor") !== "inputPerEditor",
    fields: [
      { name: "dataColor", label: "dataColor", type: "color" },
      { name: "label", label: "label", type: "text" },
      { name: "valueText", label: "valueText", type: "text" },
      { name: "valueTextColor", label: "valueTextColor", type: "color" },
      { name: "labelValueAppend", label: "labelValueAppend", type: "text" },
      { name: "tooltipTitle", label: "tooltipTitle", type: "text" },
      { name: "tooltipText", label: "tooltipText", type: "text" },
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
        default: "showValuesOn",
      },
      { name: "valuesSteps", label: "valuesSteps", type: "number" },
      { name: "valuesMinDecimals", label: "valuesMinDecimals", type: "number" },
      { name: "valuesMaxDecimals", label: "valuesMaxDecimals", type: "number" },
      { name: "valuesAppendText", label: "valuesAppendText", type: "text" },
      { name: "valuesFontColor", label: "valuesFontColor", type: "color" },
      { name: "valuesFontFamily", label: "valuesFontFamily", type: "fontname" },
      { name: "valuesFontSize", label: "valuesFontSize", type: "number" },
      {
        name: "valuesPositionAnchor",
        label: "valuesPositionAnchor",
        type: "select",
        options: ["center", "start", "end"],
        default: "end",
      },
      {
        name: "valuesPositionAlign",
        label: "valuesPositionAlign",
        type: "select",
        options: ["center", "start", "end", "right", "bottom", "left", "top"],
        default: "top",
      },
      {
        name: "valuesPositionOffset",
        label: "valuesPositionOffset",
        type: "number",
      },
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
  ...["yAxis", "xAxis"].map((axis) => ({
    name: `${axis}Layout`,
    label: `group_${axis}Layout`,
    fields: [
      {
        name: `${axis}Position`,
        label: `${axis}Position`,
        type: "select" as const,
        options: axis === "yAxis" ? ["left", "right"] : ["top", "bottom"],
      },
      { name: `${axis}Title`, label: `${axis}Title`, type: "text" as const },
      {
        name: `${axis}TitleColor`,
        label: `${axis}TitleColor`,
        type: "color" as const,
      },
      {
        name: `${axis}TitleFontFamily`,
        label: `${axis}TitleFontFamily`,
        type: "fontname" as const,
      },
      {
        name: `${axis}TitleFontSize`,
        label: `${axis}TitleFontSize`,
        type: "number" as const,
      },
      {
        name: `${axis}ValueLabelColor`,
        label: `${axis}ValueLabelColor`,
        type: "color" as const,
      },
      {
        name: `${axis}ValueFontFamily`,
        label: `${axis}ValueFontFamily`,
        type: "fontname" as const,
      },
      {
        name: `${axis}ValueFontSize`,
        label: `${axis}ValueFontSize`,
        type: "number" as const,
      },
      {
        name: `${axis}ValueDistanceToAxis`,
        label: `${axis}ValueDistanceToAxis`,
        type: "slider" as const,
        min: 0,
        max: 100,
        step: 1,
      },
      {
        name: `${axis}ShowAxis`,
        label: `${axis}ShowAxis`,
        type: "checkbox" as const,
        default: true,
      },
      {
        name: `${axis}ShowAxisLabels`,
        label: `${axis}ShowAxisLabels`,
        type: "checkbox" as const,
        default: true,
      },
      {
        name: `${axis}ShowGridLines`,
        label: `${axis}ShowGridLines`,
        type: "checkbox" as const,
        default: true,
      },
      {
        name: `${axis}GridLinesColor`,
        label: `${axis}GridLinesColor`,
        type: "color" as const,
      },
      {
        name: `${axis}GridLinesWitdh`,
        label: `${axis}GridLinesWitdh`,
        type: "number" as const,
      },
      {
        name: `${axis}ShowTicks`,
        label: `${axis}ShowTicks`,
        type: "checkbox" as const,
        default: true,
      },
      {
        name: `${axis}TickLength`,
        label: `${axis}TickLength`,
        type: "slider" as const,
        min: 0,
        max: 100,
        step: 1,
      },
      {
        name: `${axis}ZeroLineWidth`,
        label: `${axis}ZeroLineWidth`,
        type: "number" as const,
      },
      {
        name: `${axis}ZeroLineColor`,
        label: `${axis}ZeroLineColor`,
        type: "color" as const,
      },
      ...(axis === "xAxis"
        ? [
            {
              name: "xAxisTicksSource",
              label: "xAxisTicksSource",
              type: "select" as const,
              options: ["auto", "data", "labels"],
            },
            {
              name: "xAxisOffset",
              label: "xAxisOffset",
              type: "checkbox" as const,
            },
            {
              name: "xAxisOffsetGridLines",
              label: "xAxisOffsetGridLines",
              type: "checkbox" as const,
            },
            {
              name: "xAxisMinRotation",
              label: "xAxisMinRotation",
              type: "slider" as const,
              min: 0,
              max: 360,
              step: 1,
            },
            {
              name: "xAxisMaxRotation",
              label: "xAxisMaxRotation",
              type: "slider" as const,
              min: 0,
              max: 360,
              step: 1,
            },
          ]
        : []),
    ],
  })),
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
      { name: "legendFontColor", label: "legendFontColor", type: "color" },
      { name: "legendFontFamily", label: "legendFontFamily", type: "fontname" },
      { name: "legendFontSize", label: "legendFontSize", type: "number" },
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
      {
        name: "legendDistanceToChart",
        label: "legendDistanceToChart",
        type: "number",
      },
      { name: "legendPadding", label: "legendPadding", type: "number" },
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
      ...[
        "tooltipBackgroundColor",
        "tooltipTitleFontColor",
        "tooltipBodyFontColor",
      ].map((name) => ({ name, label: name, type: "color" as const })),
      ...[
        "tooltipArrowSize",
        "tooltipDistanceToBar",
        "tooltipBoxRadius",
        "tooltipXpadding",
        "tooltipYpadding",
        "tooltipTitleFontSize",
        "tooltipTitleMarginBottom",
        "tooltipBodyFontSize",
        "tooltipValueMinDecimals",
        "tooltipValueMaxDecimals",
      ].map((name) => ({ name, label: name, type: "number" as const })),
      {
        name: "tooltipShowColorBox",
        label: "tooltipShowColorBox",
        type: "checkbox",
        default: true,
      },
      {
        name: "tooltipTitleFontFamily",
        label: "tooltipTitleFontFamily",
        type: "fontname",
      },
      {
        name: "tooltipBodyFontFamily",
        label: "tooltipBodyFontFamily",
        type: "fontname",
      },
      { name: "tooltipBodyAppend", label: "tooltipBodyAppend", type: "text" },
    ],
  },
];
export default class MaterialDesignChartBar extends VisWidget {
  static getWidgetInfo(): RxWidgetInfo {
    return {
      ...createInfo("tplVis2-materialdesign-Chart-Bar", "Bar Chart", attrs),
      visPrev: '<img src="widgets/materialdesign/img/bar_chart.png"></img>',
      visDefaultStyle: { width: 400, height: 270 },
    };
  }
  getWidgetInfo(): RxWidgetInfo {
    return MaterialDesignChartBar.getWidgetInfo();
  }
  renderWidgetBody(props: RenderProps): React.JSX.Element {
    super.renderWidgetBody(props);
    const data = this.state.rxData as unknown as Data;
    const fromJson = s(data.chartDataMethod) === "jsonStringObject";
    const source = fromJson
      ? json(stateValue(this.state as VisRxWidgetState, s(data.oid)))
      : null;
    const count = source
      ? source.length
      : Math.max(1, Math.floor(n(data.dataCount, 1)) + 1);
    const colors = s(data.colorScheme)
      ? scheme(s(data.colorScheme), count)
      : [];
    const bars: Bar[] = Array.from({ length: count }, (_, i) => {
      const row = source?.[i];
      const value = n(
        row?.value,
        n(
          stateValue(
            this.state as VisRxWidgetState,
            s(indexed(data, "oid", i)),
          ),
        ),
      );
      const decimals = Math.max(0, n(data.valuesMaxDecimals, 0));
      return {
        label: s(row?.label, s(indexed(data, "label", i))),
        value,
        color: s(
          row?.dataColor,
          s(
            indexed(data, "dataColor", i),
            colors[i] || s(data.globalColor, "#44739e"),
          ),
        ),
        valueText: s(
          row?.valueText,
          s(indexed(data, "valueText", i), value.toLocaleString(undefined, { minimumFractionDigits: Math.max(0, n(data.valuesMinDecimals)), maximumFractionDigits: decimals })),
        ),
        valueColor: s(
          row?.valueColor,
          s(
            indexed(data, "valueTextColor", i),
            s(data.valuesFontColor, "#000"),
          ),
        ),
        appendix: s(
          row?.valueAppendix,
          s(indexed(data, "labelValueAppend", i), s(data.valuesAppendText)),
        ),
      };
    });
    const min =
      data.axisValueMin === "" || data.axisValueMin === undefined
        ? Math.min(0, ...bars.map((bar) => bar.value))
        : n(data.axisValueMin);
    const max =
      data.axisValueMax === "" || data.axisValueMax === undefined
        ? Math.max(1, ...bars.map((bar) => bar.value))
        : n(data.axisValueMax, 1);
    const range = Math.max(1, max - min);
    const horizontal = s(data.chartType, "vertical") === "horizontal";
    const width = 1000,
      height = 600,
      pad = {
        left: 90 + n(data.chartPaddingLeft),
        right: 35 + n(data.chartPaddingRight),
        top: 45 + n(data.chartPaddingTop),
        bottom: 90 + n(data.chartPaddingBottom),
      };
    const areaW = width - pad.left - pad.right,
      areaH = height - pad.top - pad.bottom;
    const tickCount = Math.max(
      1,
      n(data.axisValueStepSize)
        ? Math.ceil(range / n(data.axisValueStepSize))
        : 5,
    );
    const valueAt = (i: number) => min + (range * i) / tickCount;
    const barWidth = horizontal
      ? ((areaH / count) * n(data.barWidth, 80)) / 100
      : ((areaW / count) * n(data.barWidth, 80)) / 100;
    const title = s(data.title);
    const svg = (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{
          background: s(data.chartAreaBackgroundColor),
          height: "100%",
          width: "100%",
        }}
      >
        {Array.from({ length: tickCount + 1 }, (_, i) => {
          const ratio = i / tickCount;
          const x = horizontal ? pad.left + areaW * ratio : pad.left;
          const y = horizontal ? pad.top : pad.top + areaH * (1 - ratio);
          return (
            <g key={i}>
              {b(
                data[horizontal ? "xAxisShowGridLines" : "yAxisShowGridLines"],
                true,
              ) ? (
                <line
                  x1={horizontal ? x : pad.left}
                  x2={horizontal ? x : pad.left + areaW}
                  y1={horizontal ? pad.top : y}
                  y2={horizontal ? pad.top + areaH : y}
                  stroke={s(
                    data[
                      horizontal ? "xAxisGridLinesColor" : "yAxisGridLinesColor"
                    ],
                    "#ddd",
                  )}
                  strokeWidth={n(
                    data[
                      horizontal ? "xAxisGridLinesWitdh" : "yAxisGridLinesWitdh"
                    ],
                    1,
                  )}
                />
              ) : null}
              {b(
                data[
                  horizontal ? "xAxisShowAxisLabels" : "yAxisShowAxisLabels"
                ],
                true,
              ) ? (
                <text
                  x={horizontal ? x : pad.left - 10}
                  y={horizontal ? pad.top + areaH + 25 : y + 5}
                  fill={s(
                    data[
                      horizontal
                        ? "xAxisValueLabelColor"
                        : "yAxisValueLabelColor"
                    ],
                    "#333",
                  )}
                  fontFamily={s(
                    data[
                      horizontal
                        ? "xAxisValueFontFamily"
                        : "yAxisValueFontFamily"
                    ],
                  )}
                  fontSize={n(
                    data[
                      horizontal ? "xAxisValueFontSize" : "yAxisValueFontSize"
                    ],
                    18,
                  )}
                  textAnchor={horizontal ? "middle" : "end"}
                >
                  {valueAt(i).toFixed(Math.max(0, n(data.axisValueMaxDigits))) +
                    s(data.axisValueAppendText)}
                </text>
              ) : null}
            </g>
          );
        })}
        {bars.map((bar, i) => {
          const ratio = Math.max(0, Math.min(1, (bar.value - min) / range));
          const x = horizontal
            ? pad.left
            : pad.left + (areaW / count) * i + (areaW / count - barWidth) / 2;
          const y = horizontal
            ? pad.top + (areaH / count) * i + (areaH / count - barWidth) / 2
            : pad.top + areaH * (1 - ratio);
          const w = horizontal ? areaW * ratio : barWidth;
          const h = horizontal ? barWidth : areaH * ratio;
          return (
            <g key={i}>
              <rect x={x} y={y} width={w} height={h} fill={bar.color}>
                <title>{`${bar.label}: ${bar.valueText}${bar.appendix}`}</title>
              </rect>
              <text
                x={horizontal ? pad.left - 10 : x + barWidth / 2}
                y={horizontal ? y + barWidth / 2 + 6 : pad.top + areaH + 45}
                fill={s(data.xAxisValueLabelColor, "#333")}
                fontSize={n(data.xAxisValueFontSize, 18)}
                textAnchor={horizontal ? "end" : "middle"}
              >
                {bar.label}
              </text>
              {s(data.showValues, "showValuesOn") !== "showValuesOff" && i % Math.max(1, n(data.valuesSteps, 1)) === 0 ? (
                <text
                  x={
                    horizontal
                      ? x + w + n(data.valuesPositionOffset, 6)
                      : x + barWidth / 2
                  }
                  y={
                    horizontal
                      ? y + barWidth / 2 + 6
                      : y - n(data.valuesPositionOffset, 6)
                  }
                  fill={bar.valueColor}
                  fontFamily={s(data.valuesFontFamily)}
                  fontSize={n(data.valuesFontSize, 18)}
                  textAnchor={horizontal ? "start" : "middle"}
                >{`${bar.valueText}${bar.appendix}`}</text>
              ) : null}
            </g>
          );
        })}
      </svg>
    );
    const chartjs = <MaterialDesignChartCanvas type={horizontal ? "horizontalBar" : "bar"} data={{ labels: bars.map(bar => bar.label), datasets: [{ data: bars.map(bar => bar.value), backgroundColor: bars.map(bar => bar.color), borderColor: s(data.hoverBorderColor), borderWidth: n(data.hoverBorderWidth) }] }} options={{ animation: { duration: n(data.animationDuration, 1000) }, legend: { display: false }, scales: { yAxes: horizontal ? [{ ticks: { min, max } }] : [{ ticks: { min, max } }], xAxes: horizontal ? [{ ticks: { min, max } }] : [{}] }, tooltips: { enabled: b(data.showTooltip, true) } }} />;
    return (
      <div
        className="materialdesign-widget materialdesign-chart"
        style={{
          background: s(data.backgroundColor),
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
              dangerouslySetInnerHTML={{ __html: title }}
            />
                {chartjs}
          </div>
        ) : (
          chartjs
        )}
      </div>
    );
  }
}
