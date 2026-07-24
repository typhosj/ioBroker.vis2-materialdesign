import React from "react";
import { MAX_DYNAMIC_ITEMS, squarePreview, boundedCount, RenderProps, VisWidget, createInfo, designStyle, designStyleClasses, stateValue, sanitizeHtml } from './widgetUtils';
import type { RxWidgetInfo } from "@iobroker/types-vis-2";
import { colorSchemes, scheme } from "./MaterialDesignColorScheme";
import { MaterialDesignChartCanvas } from "./MaterialDesignChartCanvas";
import { chartAxis, m3ChartColors } from "./chartAxis";

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
  tooltipTitle: string;
  tooltipText: string;
};
const s = (v: unknown, d = ""): string =>
  v === undefined || v === null || v === "" || v === "null" ? d : typeof v === "string" ? v : typeof v === "number" || typeof v === "boolean" || typeof v === "bigint" ? String(v) : d;
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
export function json(value: unknown): Record<string, unknown>[] | null {
  try {
    const result: unknown = JSON.parse(s(value));
    return Array.isArray(result) ? (result as Record<string, unknown>[]) : null;
  } catch {
    return null;
  }
}

export function barCount(data: Data, source: Record<string, unknown>[] | null): number {
  return source ? Math.min(source.length, MAX_DYNAMIC_ITEMS) : boundedCount(data.dataCount, 1, MAX_DYNAMIC_ITEMS - 1) + 1;
}

export function buildBars(data: Data, source: Record<string, unknown>[] | null, count: number, colors: string[], valueForIndex: (index: number) => number): Bar[] {
  return Array.from({ length: count }, (_, i) => {
    const row = source?.[i];
    const value = n(row?.value, valueForIndex(i));
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
      tooltipTitle: s(row?.tooltipTitle, s(indexed(data, "tooltipTitle", i))),
      tooltipText: s(row?.tooltipText, s(indexed(data, "tooltipText", i))),
    };
  });
}

export function barAxisRange(data: Data, bars: Bar[]): { min: number; max: number } {
  // Treat an unset numeric field uniformly whether vis-2 stored it as "", undefined OR null: any of
  // them means "auto-scale from the data". A stray null used to fall through to n(null, 1) = 1, which
  // on chart.js v4 (where the axis min/max are actually honored, unlike the v2 build that ignored the
  // scales object) collapsed the value axis to 0..1 and clipped every bar to the same height.
  const unset = (v: unknown): boolean => v === "" || v === undefined || v === null;
  const min = unset(data.axisValueMin)
    ? Math.min(0, ...bars.map((bar) => bar.value))
    : n(data.axisValueMin);
  const max = unset(data.axisValueMax)
    ? Math.max(1, ...bars.map((bar) => bar.value))
    : n(data.axisValueMax, 1);
  return { min, max };
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
      visPrev: squarePreview('F0128'),
      visDefaultStyle: { width: 400, height: 270 },
    };
  }
  getWidgetInfo(): RxWidgetInfo {
    return MaterialDesignChartBar.getWidgetInfo();
  }
  renderWidgetBody(props: RenderProps): React.JSX.Element {
    super.renderWidgetBody(props);
    const data = this.state.rxData as unknown as Data;
    // Material 3 (Phase 7): chart-internal colors resolve to concrete M3 hex (canvas can't read CSS
    // vars); DOM card surfaces use CSS-var tokens. An explicit saved color still wins.
    const isM3 = designStyle(data) === "material3";
    const m3 = m3ChartColors(this.isDarkTheme());
    const fromJson = s(data.chartDataMethod) === "jsonStringObject";
    const source = fromJson
      ? json(stateValue(this.state, s(data.oid)))
      : null;
    const count = barCount(data, source);
    const colors = s(data.colorScheme)
      ? scheme(s(data.colorScheme), count)
      : [];
    const bars: Bar[] = buildBars(data, source, count, colors, i => n(stateValue(this.state, s(indexed(data, "oid", i)))));
    const { min, max } = barAxisRange(data, bars);
    const horizontal = s(data.chartType, "vertical") === "horizontal";
    const title = s(data.title);
    const on = (v: unknown): number | undefined => (v === undefined || v === null || v === "" || !Number.isFinite(Number(v)) ? undefined : Number(v));
    const axisOf = (ax: "x" | "y"): Record<string, unknown> => chartAxis({
      // type is set on the value axis below (linear); the category axis keeps chart.js' category default.
      position: s(data[`${ax}AxisPosition`]),
      display: b(data[`${ax}AxisShowAxis`], true),
      labelsDisplay: b(data[`${ax}AxisShowAxisLabels`], true),
      labelColor: s(data[`${ax}AxisValueLabelColor`], isM3 ? m3.text : ""),
      labelFontFamily: s(data[`${ax}AxisValueFontFamily`]),
      labelFontSize: on(data[`${ax}AxisValueFontSize`]),
      labelPadding: on(data[`${ax}AxisValueDistanceToAxis`]),
      title: s(data[`${ax}AxisTitle`]),
      titleColor: s(data[`${ax}AxisTitleColor`], isM3 ? m3.text : ""),
      titleFontFamily: s(data[`${ax}AxisTitleFontFamily`]),
      titleFontSize: on(data[`${ax}AxisTitleFontSize`]),
      gridDisplay: b(data[`${ax}AxisShowGridLines`], true),
      gridColor: s(data[`${ax}AxisGridLinesColor`], isM3 ? m3.grid : ""),
      gridWidth: on(data[`${ax}AxisGridLinesWitdh`]),
      drawTicks: b(data[`${ax}AxisShowTicks`], true),
      tickLength: on(data[`${ax}AxisTickLength`]),
      // zeroLine* has no chart.js v4 equivalent (dropped in the migration; editor fields remain inert).
    });
    // value axis (numeric) carries the computed min/max; the other axis holds category labels.
    // v4: horizontalBar is gone -> type "bar" + indexAxis "y"; scales are a keyed object, not xAxes/yAxes arrays.
    const valueAxis = axisOf(horizontal ? "x" : "y");
    valueAxis.type = "linear"; valueAxis.min = min; valueAxis.max = max;
    const catAxis = axisOf(horizontal ? "y" : "x");
    const scales = { [horizontal ? "x" : "y"]: valueAxis, [horizontal ? "y" : "x"]: catAxis };
    const chartjs = <MaterialDesignChartCanvas type="bar" data={{ labels: bars.map(bar => bar.label), datasets: [{ data: bars.map(bar => bar.value), backgroundColor: bars.map(bar => isM3 && bar.color === "#44739e" ? m3.primary : bar.color), borderColor: s(data.hoverBorderColor), borderWidth: n(data.hoverBorderWidth) }] }} options={{ indexAxis: horizontal ? "y" : "x", responsive: true, maintainAspectRatio: false, animation: { duration: n(data.animationDuration, 1000) }, scales, plugins: { legend: { display: false }, tooltip: { enabled: b(data.showTooltip, true), callbacks: {
      title: (items: { dataIndex?: number }[]) => { const bar = bars[n(items[0]?.dataIndex)]; return bar?.tooltipTitle ? bar.tooltipTitle.split("\\n") : s(bar?.label); },
      label: (item: { dataIndex?: number }) => { const bar = bars[n(item.dataIndex)]; return bar?.tooltipText ? bar.tooltipText.split("\\n") : `${s(bar?.valueText)}${s(bar?.appendix)}`; },
    } } } }} />;
    return (
      <div
        className={`materialdesign-widget materialdesign-chart${isM3 ? ` ${designStyleClasses(data, this.isDarkTheme())}` : ""}`}
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
              background: s(data.colorBackground) || (isM3 ? "var(--md-sys-color-surface-container-low)" : undefined),
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
                color: s(data.colorTitle) || (isM3 ? "var(--md-sys-color-on-surface)" : undefined),
                fontFamily: s(data.titleFontFamily),
              }}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(title) }}
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
