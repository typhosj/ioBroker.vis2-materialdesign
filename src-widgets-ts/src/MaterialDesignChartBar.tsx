import React from "react";
import { MAX_DYNAMIC_ITEMS, squarePreview, itemCount, RenderProps, VisWidget, createInfo, designStyle, designStyleClasses, stateValue, sanitizeHtml } from './widgetUtils';
import type { RxWidgetInfo } from "@iobroker/types-vis-2";
import { colorSchemes, scheme } from "./MaterialDesignColorScheme";
import { MaterialDesignChartCanvas, datalabelsConfig } from "./MaterialDesignChartCanvas";
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
  return source ? Math.min(source.length, MAX_DYNAMIC_ITEMS) : itemCount(data.dataCount);
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
      // Empty means "not configured": the label color is then derived from the bar it is drawn on.
      valueColor: s(
        row?.valueColor,
        s(
          indexed(data, "valueTextColor", i),
          s(data.valuesFontColor),
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
  // Unset means "auto-scale from the data", whether vis-2 stored "", undefined or null. A stray null
  // fell through to 1, which on v4 collapsed the value axis to 0..1 and clipped every bar.
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
  // One group per data set, holding its object id AND its layout. VIS 1 had those as two separate
  // indexed groups, but vis-2 expands only the FIRST indexed group of a widget: its rescan for the
  // next one tests `group.indexFrom` for truthiness (visWidgetsCatalog.tsx), and ours start at index
  // 0. A second indexed group therefore renders exactly once, with unindexed field names — which is
  // how the per-data-set layout went missing. Field names are unchanged, so saved charts keep every
  // value.
  {
    name: "oids",
    label: "group_oids",
    indexFrom: 0,
    indexTo: "dataCount",
    // vis-2 expands 0..dataCount, one row more than the count asks for, and puts the clone, delete
    // and add buttons on that last row — hiding it left no way to add a data set at all.
    hidden: (data: Data) => s(data.chartDataMethod, "inputPerEditor") !== "inputPerEditor",
    fields: [
      { name: "oid", label: "oid", type: "id" },
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
      { name: "valuesBackgroundColor", label: "valuesBackgroundColor", type: "color" },
      { name: "valuesBorderColor", label: "valuesBorderColor", type: "color" },
      { name: "valuesBorderWidth", label: "valuesBorderWidth", type: "number" },
      { name: "valuesBorderRadius", label: "valuesBorderRadius", type: "number" },
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
      ...createInfo("tplVis2-materialdesign-Chart-Bar", "Bar Chart", attrs, ["card", "barValuesLayout", "legendLayout", "tooltipLayout"]),
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
    // Canvas cannot read CSS vars, so chart-internal colors resolve to concrete M3 hex.
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
      // zeroLine* has no chart.js v4 equivalent; the editor fields remain inert.
    });
    // v4: horizontalBar is gone -> type "bar" + indexAxis "y"; scales are a keyed object.
    const valueAxis = axisOf(horizontal ? "x" : "y");
    valueAxis.type = "linear"; valueAxis.min = min; valueAxis.max = max;
    const catAxis = axisOf(horizontal ? "y" : "x");
    const scales = { [horizontal ? "x" : "y"]: valueAxis, [horizontal ? "y" : "x"]: catAxis };
    const chartjs = <MaterialDesignChartCanvas type="bar" data={{ labels: bars.map(bar => bar.label), datasets: [{ data: bars.map(bar => bar.value), backgroundColor: bars.map(bar => isM3 && bar.color === "#44739e" ? m3.primary : bar.color), borderColor: s(data.hoverBorderColor), borderWidth: n(data.hoverBorderWidth) }] }} options={{ indexAxis: horizontal ? "y" : "x", responsive: true, maintainAspectRatio: false, animation: { duration: n(data.animationDuration, 1000) }, scales, plugins: { datalabels: datalabelsConfig(data, index => { const bar = bars[index]; return { color: bar?.valueColor, text: `${s(bar?.valueText)}${s(bar?.appendix)}` }; }, { align: "top", anchor: "end" }), legend: { display: false }, tooltip: { enabled: b(data.showTooltip, true), callbacks: {
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
              display: "flex",
              flexDirection: "column",
              // Inset: the card filled the widget box, and VIS2 clips there — the whole card shadow
              // and its rounded edge sat outside the visible area.
              height: "calc(100% - 6px)",
              margin: 3,
              padding: n(data.borderDistance, 8),
              width: "calc(100% - 6px)",
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
            {/* The canvas is height:100%, so in a plain block card it kept the FULL card height and
                the title pushed its bottom axis out of the widget. Flex row that takes the rest. */}
            <div style={{ flex: "1 1 0", minHeight: 0 }}>{chartjs}</div>
          </div>
        ) : (
          chartjs
        )}
      </div>
    );
  }
}
