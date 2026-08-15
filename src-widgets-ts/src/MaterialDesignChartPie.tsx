import React from "react";
import { MAX_DYNAMIC_ITEMS, squarePreview, indexedFields, itemCount, RenderProps, VisWidget, createInfo, designStyle, designStyleClasses, stateValue, sanitizeHtml } from './widgetUtils';
import type { RxWidgetInfo } from "@iobroker/types-vis-2";
import { colorSchemes, scheme } from "./MaterialDesignColorScheme";
import { MaterialDesignChartCanvas, datalabelsConfig } from "./MaterialDesignChartCanvas";
import { m3ChartColors } from "./chartAxis";

type Data = Record<string, unknown> & {
  oid?: string;
  dataCount?: number;
  chartDataMethod?: string;
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
export function readJson(value: unknown): Record<string, unknown>[] | null {
  try {
    const result: unknown = JSON.parse(s(value));
    return Array.isArray(result) ? (result as Record<string, unknown>[]) : null;
  } catch {
    return null;
  }
}

export interface PieValue {
  label: string;
  value: number;
  color: string;
  textColor: string;
  appendix: string;
  tooltipTitle: string;
  tooltipText: string;
}

export function pieCount(data: Data, source: Record<string, unknown>[] | null): number {
  return source ? Math.min(source.length, MAX_DYNAMIC_ITEMS) : itemCount(data.dataCount);
}

export function buildPieValues(data: Data, source: Record<string, unknown>[] | null, count: number, colors: string[], valueForIndex: (index: number) => number): PieValue[] {
  return Array.from({ length: count }, (_, i) => {
    const item = source?.[i];
    const value = n(item?.value, valueForIndex(i));
    return {
      label: s(item?.label, s(data[`label${i}`])),
      value: Math.max(0, value),
      color: s(
        item?.dataColor,
        s(data[`dataColor${i}`], colors[i] || s(data.globalColor, "#44739e")),
      ),
      // Empty means "not configured": the label color is then derived from the slice it is drawn on.
      textColor: s(
        item?.valueColor,
        s(data[`valueTextColor${i}`], s(data.valuesFontColor)),
      ),
      appendix: s(
        item?.valueAppendix,
        s(data[`labelValueAppend${i}`], s(data.valuesAppendText)),
      ),
      tooltipTitle: s(item?.tooltipTitle, s(data[`tooltipTitle${i}`])),
      tooltipText: s(item?.tooltipText, s(data[`tooltipText${i}`])),
    };
  });
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
    fields: indexedFields(
      [
        { name: "oid", label: "oid", type: "id" },
        color("dataColor"),
        { name: "label", label: "label", type: "text" },
        color("valueTextColor"),
        { name: "labelValueAppend", label: "labelValueAppend", type: "text" },
        { name: "tooltipTitle", label: "tooltipTitle", type: "text" },
        { name: "tooltipText", label: "tooltipText", type: "text" },
      ],
      data => itemCount(data.dataCount),
    ),
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
      color("valuesBackgroundColor"),
      color("valuesBorderColor"),
      number("valuesBorderWidth"),
      number("valuesBorderRadius"),
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
      ...createInfo("tplVis2-materialdesign-Chart-Pie", "Pie Chart", attrs, ["card", "pieValuesLayout", "legendLayout", "tooltipLayout"]),
      visPrev: squarePreview('F012B'),
      visDefaultStyle: { width: 400, height: 270 },
    };
  }
  getWidgetInfo(): RxWidgetInfo {
    return MaterialDesignChartPie.getWidgetInfo();
  }
  renderWidgetBody(props: RenderProps): React.JSX.Element {
    super.renderWidgetBody(props);
    const data = this.state.rxData as unknown as Data;
    const isM3 = designStyle(data) === "material3";
    const m3 = m3ChartColors(this.isDarkTheme());
    const json =
      s(data.chartDataMethod) === "jsonStringObject"
        ? readJson(stateValue(this.state, s(data.oid)))
        : null;
    const count = pieCount(data, json);
    const colors = s(data.colorScheme)
      ? scheme(s(data.colorScheme), count)
      : [];
    const values = buildPieValues(data, json, count, colors, i => n(stateValue(this.state, s(data[`oid${i}`]))));
    const legend = b(data.showLegend) ? (
      <div
        style={{
          display: "flex",
          flexDirection: ["top", "bottom"].includes(s(data.legendPosition))
            ? "row"
            : "column",
          flexWrap: "wrap",
          flexShrink: 0,
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
              color: s(data.legendFontColor) || (isM3 ? "var(--md-sys-color-on-surface)" : undefined),
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
    const chartjs = <MaterialDesignChartCanvas type={s(data.chartType, "pie")} data={{ labels: values.map(item => item.label), datasets: [{ data: values.map(item => item.value), backgroundColor: values.map(item => isM3 && item.color === "#44739e" ? m3.primary : item.color), borderColor: s(data.borderColor, "#fff"), borderWidth: n(data.borderWidth, 1) }] }} options={{ responsive: true, maintainAspectRatio: false, animation: { duration: n(data.animationDuration, 1000) }, cutout: s(data.chartType) === "doughnut" ? `${n(data.doughnutCutOut, 50)}%` : 0, plugins: { datalabels: datalabelsConfig(data, index => { const item = values[index]; return { color: item?.textColor, text: `${n(item?.value).toLocaleString(undefined, { minimumFractionDigits: Math.max(0, n(data.valuesMinDecimals)), maximumFractionDigits: Math.max(0, n(data.valuesMaxDecimals)) })}${s(item?.appendix)}` }; // `align: "end"` pushes the label outward from the middle of the arc band. On a pie that lands
    // inside the slice, but on a doughnut the band is narrow and its middle already sits near the
    // outer edge — the labels ended up outside the colored ring, the wider the cut-out the further
    // out. Doughnuts centre the label in the band instead; `valuesPositionAlign` still overrides.
    }, { align: s(data.chartType) === "doughnut" ? "center" : "end", anchor: "center" }), legend: { display: false }, tooltip: { enabled: b(data.showTooltip, true), callbacks: {
      title: (items: { dataIndex?: number }[]) => { const item = values[n(items[0]?.dataIndex)]; return item?.tooltipTitle ? item.tooltipTitle.split("\\n") : ""; },
      label: (item: { dataIndex?: number }) => { const v = values[n(item.dataIndex)]; if (v?.tooltipText) return v.tooltipText.split("\\n"); const num = n(v?.value).toLocaleString(undefined, { minimumFractionDigits: Math.max(0, n(data.tooltipValueMinDecimals)), maximumFractionDigits: Math.max(0, n(data.tooltipValueMaxDecimals)) }); return `${s(v?.label)}: ${num}${s(v?.appendix)}`; },
    } } } }} />;
    const chartBox = (
      <div style={{ flex: 1, minWidth: 0, minHeight: 0, position: "relative" }}>{chartjs}</div>
    );
    const legendFirst = ["top", "left"].includes(s(data.legendPosition, "top"));
    const body = legendFirst ? (
      <>{legend}{chartBox}</>
    ) : (
      <>{chartBox}{legend}</>
    );
    return (
      <div
        className={`materialdesign-widget materialdesign-chart${isM3 ? ` ${designStyleClasses(data, this.isDarkTheme())}` : ""}`}
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
