import React from "react";
import { squarePreview, indexedFields, itemCount, RenderProps, VisWidget, createInfo, designStyle, designStyleClasses, formatMoment, visLocale, stateValue, sanitizeHtml } from './widgetUtils';
import type { RxWidgetInfo, VisRxWidgetState } from "@iobroker/types-vis-2";
import { colorSchemes, scheme } from "./MaterialDesignColorScheme";
import { ChartLegend, MaterialDesignChartCanvas, datalabelsConfig, layoutConfig, tooltipConfig } from "./MaterialDesignChartCanvas";
import { chartAxis, m3ChartColors } from "./chartAxis";

type Data = Record<string, unknown>;
type Point = { ts: number; val: number | null };
type Series = { oid: string; points: Point[]; error?: string };
type Socket = {
  getHistory(
    id: string,
    options: ioBroker.GetHistoryOptions,
  ): Promise<ioBroker.GetHistoryResult>;
};
const intervals: Record<string, number> = {
  "30 seconds": 30000,
  "1 minute": 60000,
  "2 minutes": 120000,
  "5 minutes": 300000,
  "10 minutes": 600000,
  "30 minutes": 1800000,
  "1 hour": 3600000,
  "2 hours": 7200000,
  "4 hours": 14400000,
  "8 hours": 28800000,
  "12 hours": 43200000,
  "1 day": 86400000,
  "2 days": 172800000,
  "3 days": 259200000,
  "7 days": 604800000,
  "14 days": 1209600000,
  "1 month": 2628000000,
  "2 months": 5256000000,
  "3 months": 7884000000,
  "6 months": 15768000000,
  "1 year": 31536000000,
  "2 years": 63072000000,
};
const s = (v: unknown, d = "") =>
  v === undefined || v === null || v === "" || v === "null" ? d : typeof v === "string" ? v : typeof v === "number" || typeof v === "boolean" || typeof v === "bigint" ? String(v) : d;
const n = (v: unknown, d = 0) =>
  v === undefined || v === null || v === "" || !Number.isFinite(Number(v))
    ? d
    : Number(v);
const b = (v: unknown, d = false) =>
  v === undefined || v === null || v === ""
    ? d
    : v === true || v === "true" || v === 1 || v === "1";
// vis-2 stores row 0 of an indexed group under the plain base name, higher rows as `${name}${i}`.
export const item = (d: Data, key: string, i: number): unknown => { const v = d[`${key}${i}`]; return v !== undefined ? v : (i === 0 ? d[key] : undefined); };
export function seriesColor(d: Data, i: number, colors: string[], globalColor: unknown): string {
  return s(item(d, "dataColor", i), colors[i] || s(globalColor, "#44739e"));
}
export function rowAxisId(d: Data, i: number): string {
  return `yAxis_id_${n(item(d, "commonYAxis", i), 0)}`;
}
// Relies on rowIdx being the identity sequence [0..n-1], so findIndex can be compared against i.
export function distinctAxisRows(rowIdx: number[], d: Data): number[] {
  return rowIdx.filter(i => rowIdx.findIndex(j => rowAxisId(d, j) === rowAxisId(d, i)) === i);
}
const color = (name: string) => ({ name, label: name, type: "color" as const });
const num = (name: string) => ({ name, label: name, type: "number" as const });
// vis-2 expands 0..dataCount, one row more than the count asks for, and puts the clone, delete and
// add buttons on that last row — hiding it left no way to add a data set at all.
const rows = (fields: RxWidgetInfo["visAttrs"][number]["fields"]) => ({
  indexFrom: 0,
  indexTo: "dataCount",
  fields: indexedFields(fields, data => itemCount(data.dataCount)),
});
const attrs: RxWidgetInfo["visAttrs"] = [
  {
    name: "common",
    fields: [
      {
        name: "historyAdapterInstance",
        label: "historyAdapterInstance",
        type: "history",
      },
      { name: "dataCount", label: "dataCount", type: "number", default: 1 },
      {
        name: "timeIntervalToShow",
        label: "timeIntervalToShow",
        type: "select",
        options: Object.keys(intervals),
        default: "10 minutes",
      },
      { name: "time_interval_oid", label: "time_interval_oid", type: "id" },
      {
        name: "refreshMethod",
        label: "refreshMethod",
        type: "select",
        options: ["realtime", "timeInterval", "byObject"],
        default: "timeInterval",
      },
      {
        name: "refreshTimeInterval",
        label: "refreshTimeInterval",
        type: "select",
        options: Object.keys(intervals).slice(0, 13),
        default: "1 minute",
      },
      {
        name: "manualRefreshTrigger",
        label: "manualRefreshTrigger",
        type: "id",
      },
      num("chartTimeout"),
    ],
  },
  {
    name: "chartLayout",
    label: "group_chartLayout",
    fields: [
      color("backgroundColor"),
      color("chartAreaBackgroundColor"),
      num("chartPaddingTop"),
      num("chartPaddingLeft"),
      num("chartPaddingRight"),
      num("chartPaddingBottom"),
    ],
  },
  {
    name: "card",
    label: "group_listItemCardBackground",
    fields: [
      { name: "cardUse", label: "cardUse", type: "checkbox" },
      { name: "title", label: "title", type: "html" },
      { name: "titleLayout", label: "titleLayout", type: "text" },
      num("borderDistance"),
      { name: "titleFontFamily", label: "titleFontFamily", type: "fontname" },
      color("colorBackground"), color("colorTitleSectionBackground"), color("colorTextSectionBackground"), color("colorTitle"),
    ],
  },
  // One group per data set: object id, line layout and its own y-axis together. vis-2 expands only
  // the FIRST indexed group of a widget — the rescan for the next one tests `group.indexFrom` for
  // truthiness (visWidgetsCatalog.tsx) and ours start at index 0 — so every further indexed group
  // rendered once, with unindexed field names. Field names are unchanged, saved charts keep values.
  {
    name: "oids",
    label: "group_oids",
    ...rows([
      { name: "oid", label: "oid", type: "id" },
      {
        name: "aggregate",
        label: "aggregate",
        type: "select",
        options: ["minmax", "min", "max", "average", "total"],
        default: "minmax",
      },
      num("maxDataPoints"),
      num("minTimeInterval"),
      num("multiply"),
      {
        name: "lineSpanGaps",
        label: "lineSpanGaps",
        type: "checkbox",
        default: true,
      },
      { name: "steppedLine", label: "steppedLine", type: "checkbox" },
      num("lineThikness"),
      color("dataColor"),
      { name: "useFillColor", label: "useFillColor", type: "checkbox" },
      color("fillColor"),
      color("pointColor"),
      { name: "legendText", label: "legendText", type: "text" },
      { name: "showValues", label: "showValues", type: "select", options: ["showValuesOn", "showValuesOff", "showValuesAuto"], default: "showValuesOn" },
      num("valuesSteps"),
      num("valuesMinDecimals"),
      num("valuesMaxDecimals"),
      { name: "valuesAppendText", label: "valuesAppendText", type: "text" },
      color("valuesFontColor"),
      { name: "valuesFontFamily", label: "valuesFontFamily", type: "fontname" },
      num("valuesFontSize"),
      color("valuesBackgroundColor"),
      color("valuesBorderColor"),
      num("valuesBorderWidth"),
      num("valuesBorderRadius"),
      { name: "showYAxis", label: "showYAxis", type: "checkbox", default: true }, { name: "yAxisPosition", label: "yAxisPosition", type: "select", options: ["left", "right"], default: "left" }, { name: "yAxisTitle", label: "yAxisTitle", type: "text" }, num("yAxisMinValue"), num("yAxisMaxValue"), num("yAxisStep"), color("yAxisGridLinesColor"),
    ]),
  },
  {
    name: "lineLayout",
    label: "group_lineLayout",
    fields: [
      {
        name: "colorScheme",
        label: "colorScheme",
        type: "select",
        options: Object.keys(colorSchemes),
      },
      color("globalColor"),
      num("pointSize"),
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
      num("legendFontSize"),
      num("legendBoxWidth"),
      num("legendPadding"),
    ],
  },
  {
    name: "xAxisLayout",
    label: "group_xAxisLayout",
    fields: [
      { name: "xAxisTimeFormats", label: "xAxisTimeFormats", type: "text" },
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
    name: "tooltipLayout",
    label: "group_tooltipLayout",
    fields: [
      { name: "showTooltip", label: "showTooltip", type: "checkbox", default: true },
      { name: "tooltipMode", label: "tooltipMode", type: "select", options: ["nearest", "point", "index", "dataset", "x", "y"], default: "nearest" },
      color("tooltipBackgroundColor"), color("tooltipTitleFontColor"), color("tooltipBodyFontColor"),
      { name: "tooltipTitleFontFamily", label: "tooltipTitleFontFamily", type: "fontname" },
      { name: "tooltipBodyFontFamily", label: "tooltipBodyFontFamily", type: "fontname" }, num("tooltipTitleFontSize"), num("tooltipBodyFontSize"), num("tooltipValueMinDecimals"), num("tooltipValueMaxDecimals"), { name: "tooltipBodyAppend", label: "tooltipBodyAppend", type: "text" },
    ],
  },
  {
    name: "yAxisLayout",
    label: "group_yAxisLayout",
    fields: [color("yAxisTitleColor"), { name: "yAxisTitleFontFamily", label: "yAxisTitleFontFamily", type: "fontname" }, num("yAxisTitleFontSize"), color("yAxisValueLabelColor"), { name: "yAxisValueFontFamily", label: "yAxisValueFontFamily", type: "fontname" }, num("yAxisValueFontSize")],
  },
];

export default class MaterialDesignChartLineHistory extends VisWidget {
  private series: Series[] = [];
  private timer?: number;
  private key = "";
  private request = 0;
  private alive = false;
  static getWidgetInfo(): RxWidgetInfo {
    return {
      ...createInfo(
        "tplVis2-materialdesign-Chart-Line-History",
        "Line History Chart",
        attrs,
        ["card", "legendLayout", "tooltipLayout", "xAxisLayout", "yAxisLayout"],
      ),
      visPrev: squarePreview('F012A'),
      visDefaultStyle: { width: 400, height: 270 },
    };
  }
  getWidgetInfo(): RxWidgetInfo {
    return MaterialDesignChartLineHistory.getWidgetInfo();
  }
  componentDidMount(): void {
    super.componentDidMount();
    this.alive = true;
    this.update();
  }
  componentDidUpdate(): void {
    this.update();
  }
  componentWillUnmount(): void {
    this.alive = false;
    this.request++;
    if (this.timer) window.clearInterval(this.timer);
    super.componentWillUnmount?.();
  }
  private signature(d: Data): string {
    const count = itemCount(d.dataCount);
    return JSON.stringify({
      d,
      time: stateValue(this.state, s(d.time_interval_oid)),
      trigger: stateValue(
        this.state,
        s(d.manualRefreshTrigger),
      ),
      values: Array.from({ length: count }, (_, i) =>
        stateValue(this.state as VisRxWidgetState, s(item(d, "oid", i))),
      ),
    });
  }
  private update(): void {
    const d = this.state.rxData as unknown as Data,
      key = this.signature(d);
    if (key === this.key) return;
    this.key = key;
    if (this.timer) window.clearInterval(this.timer);
    if (s(d.refreshMethod) === "timeInterval")
      this.timer = window.setInterval(
        () => {
          this.key = "";
          this.update();
        },
        Math.max(
          1000,
          intervals[s(d.refreshTimeInterval, "1 minute")] || 60000,
        ),
      );
    void this.load(d);
  }
  private async load(d: Data): Promise<void> {
    const socket = this.props.context?.socket as unknown as Socket | undefined,
      count = itemCount(d.dataCount),
      controlled = stateValue(
        this.state,
        s(d.time_interval_oid),
      ),
      span =
        typeof controlled === "string" && intervals[controlled]
          ? intervals[controlled]
          : intervals[s(d.timeIntervalToShow, "10 minutes")] || 600000,
      start = typeof controlled === "number" ? controlled : Date.now() - span,
      request = ++this.request;
    if (!socket?.getHistory || !s(d.historyAdapterInstance)) {
      this.series = [];
      this.forceUpdate();
      return;
    }
    const all = await Promise.all(
      Array.from(
        { length: count },
        async (_, i): Promise<Series | null> => {
          const oid = s(item(d, "oid", i));
          if (!oid) return null;
          try {
            const values = await socket.getHistory(oid, {
              instance: s(d.historyAdapterInstance),
              start,
              end: Date.now(),
              count: Math.max(
                1,
                Math.floor(
                  n(
                    item(d, "maxDataPoints", i),
                    s(item(d, "aggregate", i), "minmax") === "minmax"
                      ? 50
                      : 100,
                  ),
                ),
              ),
              step:
                n(item(d, "minTimeInterval", i)) > 0
                  ? n(item(d, "minTimeInterval", i)) * 1000
                  : undefined,
              aggregate: s(item(d, "aggregate", i), "minmax") as ioBroker.GetHistoryOptions["aggregate"],
              timeout: Math.max(0, n(d.chartTimeout, 2)) * 1000,
            } as ioBroker.GetHistoryOptions & { timeout: number });
            return {
              oid,
              points: values.map((v) => ({
                ts: Number(v.ts),
                val:
                  v.val === null || !Number.isFinite(Number(v.val))
                    ? null
                    : Number(v.val) * n(item(d, "multiply", i), 1),
              })),
            };
          } catch (error) {
            return { oid, points: [], error: String(error) };
          }
        },
      ),
    );
    if (request !== this.request || !this.alive) return;
    this.series = all.filter((v): v is Series => v !== null);
    this.forceUpdate();
  }
  renderWidgetBody(props: RenderProps): React.JSX.Element {
    super.renderWidgetBody(props);
    const d = this.state.rxData as unknown as Data,
      colors = s(d.colorScheme)
        ? scheme(s(d.colorScheme), this.series.length)
        : [];
    const isM3 = designStyle(d) === "material3";
    const m3 = m3ChartColors(this.isDarkTheme());
    // Axes come from the configured data rows, not the loaded series — an empty history range would
    // otherwise leave chart.js on a default axis that ignores show/position.
    const on = (v: unknown): number | undefined => (v === undefined || v === null || v === "" || !Number.isFinite(Number(v)) ? undefined : Number(v));
    const rowIdx = Array.from({ length: itemCount(d.dataCount) }, (_v, i) => i);
    const yAxisIdOf = (i: number) => rowAxisId(d, i);
    const yEntries = distinctAxisRows(rowIdx, d)
      .map((i): [string, Record<string, unknown>] => [yAxisIdOf(i), chartAxis({
        axis: "y",
        type: "linear",
        position: s(item(d, "yAxisPosition", i), "left"),
        display: b(item(d, "showYAxis", i), true),
        title: s(item(d, "yAxisTitle", i)),
        titleColor: s(d.yAxisTitleColor, isM3 ? m3.text : ""), titleFontFamily: s(d.yAxisTitleFontFamily), titleFontSize: on(d.yAxisTitleFontSize),
        labelColor: s(d.yAxisValueLabelColor, isM3 ? m3.text : ""), labelFontFamily: s(d.yAxisValueFontFamily), labelFontSize: on(d.yAxisValueFontSize),
        gridColor: s(item(d, "yAxisGridLinesColor", i), isM3 ? m3.grid : ""),
        min: on(item(d, "yAxisMinValue", i)), max: on(item(d, "yAxisMaxValue", i)), stepSize: on(item(d, "yAxisStep", i)),
      })]);
    // v4 dropped the built-in moment time scale: linear x-axis over raw timestamps, ticks pre-formatted
    // by formatMoment. Automatic unit-based tick spacing is gone (../PORTING.md).
    const timeFmt = s(d.xAxisTimeFormats);
    const locale = visLocale();
    // new Date(NaN) is an Invalid Date, and formatMoment's month/weekday tokens throw RangeError on it.
    const fmtTime = (value: unknown, token: string): string => {
      const ms = Number(value);
      return Number.isFinite(ms) ? formatMoment(new Date(ms), token, locale) : "";
    };
    const xAxis = chartAxis({
      axis: "x",
      type: "linear",
      labelColor: s(d.xAxisValueLabelColor, isM3 ? m3.text : ""),
      gridDisplay: b(d.xAxisShowGridLines, true),
      gridColor: s(d.xAxisGridLinesColor, isM3 ? m3.grid : ""),
      tickCallback: (value) => fmtTime(value, timeFmt || "HH:mm"),
    });
    const scales: Record<string, unknown> = { x: xAxis, ...Object.fromEntries(yEntries) };
    // Value labels are per series here, so they ride on the dataset; the plugin default below stays
    // `display: false` because a dataset without its own config labels the raw {x,y} object.
    const seriesLabels = (i: number, points: Point[], dsColor: string): object => {
      const min = Math.max(0, n(item(d, "valuesMinDecimals", i)));
      const max = Math.max(min, n(item(d, "valuesMaxDecimals", i)));
      const append = s(item(d, "valuesAppendText", i));
      const labelColor = s(item(d, "valuesFontColor", i), dsColor);
      const perSeries: Data = { designStyle: d.designStyle };
      for (const key of ["showValues", "valuesSteps", "valuesFontFamily", "valuesFontSize", "valuesBackgroundColor", "valuesBorderColor", "valuesBorderWidth", "valuesBorderRadius"]) perSeries[key] = item(d, key, i);
      return datalabelsConfig(perSeries, index => ({ color: labelColor, text: `${n(points[index]?.val).toLocaleString(visLocale(), { maximumFractionDigits: max, minimumFractionDigits: min })}${append}` }), { align: "top", anchor: "end" });
    };
    // Without a label callback the tooltip prints chart.js' raw default, so the decimals and the
    // appended unit configured right next to it stayed dead.
    const tipMin = Math.max(0, n(d.tooltipValueMinDecimals));
    const tipMax = Math.max(tipMin, n(d.tooltipValueMaxDecimals, 2));
    const tooltipLabel = (item: { dataset?: { label?: string }; parsed?: { y?: number } }): string => {
      const value = n(item.parsed?.y).toLocaleString(locale, { maximumFractionDigits: tipMax, minimumFractionDigits: tipMin });
      return `${s(item.dataset?.label)}: ${value}${s(d.tooltipBodyAppend)}`;
    };
    // chart.js v4 hard-crashes (vScale undefined) if a dataset references a y-axis id with no scale;
    // series indices can diverge from configured rows (sparse oids).
    this.series.forEach((_series, i) => { const id = yAxisIdOf(i); if (!(id in scales)) scales[id] = { axis: "y", type: "linear", position: "left" }; });
    const chartjs = <MaterialDesignChartCanvas type="line" data={{ datasets: this.series.map((series, i) => { const seriesColorValue = seriesColor(d, i, colors, d.globalColor); const dsColor = isM3 && seriesColorValue === "#44739e" ? m3.primary : seriesColorValue; const points = series.points.filter(point => point.val !== null); return { label: s(item(d, "legendText", i), series.oid), data: points.map(point => ({ x: point.ts, y: point.val })), datalabels: seriesLabels(i, points, dsColor), borderColor: dsColor, backgroundColor: b(item(d, "useFillColor", i)) ? s(item(d, "fillColor", i), `${dsColor}33`) : "transparent", fill: b(item(d, "useFillColor", i)), borderWidth: n(item(d, "lineThikness", i), 2), stepped: b(item(d, "steppedLine", i)), tension: 0, pointBackgroundColor: s(item(d, "pointColor", i), dsColor), pointRadius: n(d.pointSize, 3), yAxisID: yAxisIdOf(i), spanGaps: b(item(d, "lineSpanGaps", i), true) }; }) }} options={{ responsive: true, maintainAspectRatio: false, layout: layoutConfig(d), animation: { duration: n(d.animationDuration, 1000) }, scales, plugins: { legend: { display: false }, datalabels: { display: false }, mdwChartArea: { color: s(d.chartAreaBackgroundColor) }, tooltip: tooltipConfig(d, { title: (items: { parsed?: { x?: number } }[]) => fmtTime(items[0]?.parsed?.x, timeFmt || "lll"), label: tooltipLabel }) } }} />;
    const legend = <ChartLegend data={d} entries={this.series.map((series, i) => ({ label: s(item(d, "legendText", i), series.oid), color: s(item(d, "dataColor", i), colors[i] || s(d.globalColor, "#44739e")) }))} />;
    const chartMain = b(d.cardUse) ? (
      <div className="materialdesign-html-card-container mdc-card" style={{ background: s(d.colorBackground) || (isM3 ? "var(--md-sys-color-surface-container-low)" : undefined), boxSizing: "border-box", display: "flex", flexDirection: "column", height: "calc(100% - 6px)", margin: 3, padding: n(d.borderDistance, 8), width: "calc(100% - 6px)" }}>
        <div style={{ background: s(d.colorTitleSectionBackground), color: s(d.colorTitle) || (isM3 ? "var(--md-sys-color-on-surface)" : undefined), fontFamily: s(d.titleFontFamily), fontSize: n(d.titleLayout) ? `${n(d.titleLayout)}px` : undefined }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(s(d.title)) }} />
        {/* The canvas is height:100%, so without a flex row of its own it keeps the full card height
            and the title pushes its bottom axis out of the widget. */}
        <div style={{ background: s(d.colorTextSectionBackground), flex: "1 1 0", minHeight: 0 }}>{chartjs}</div>
      </div>
    ) : chartjs;
    const chartBox = (
      <div style={{ flex: 1, minWidth: 0, minHeight: 0, position: "relative" }}>{chartMain}</div>
    );
    const legendFirst = ["top", "left"].includes(s(d.legendPosition, "right"));
    const body = legendFirst ? (
      <>{legend}{chartBox}</>
    ) : (
      <>{chartBox}{legend}</>
    );
    return (
      <div
        className={`materialdesign-widget materialdesign-chart${isM3 ? ` ${designStyleClasses(d, this.isDarkTheme())}` : ""}`}
        style={{
          background: s(d.backgroundColor) || (isM3 ? "var(--md-sys-color-surface)" : undefined),
          display: "flex",
          flexDirection: ["top", "bottom"].includes(s(d.legendPosition))
            ? "column"
            : "row",
          height: "100%",
          width: "100%",
        }}
      >
        {body}
      </div>
    );
  }
}
