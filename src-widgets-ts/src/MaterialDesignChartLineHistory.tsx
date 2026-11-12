import { squarePreview, indexedFields, itemCount, createInfo, designStyle, formatMoment, visLocale, stateValue, boolValue as b, numberValue as n, textValue as s } from "./widgetUtils";
import type { RxWidgetInfo, VisRxWidgetState } from "@iobroker/types-vis-2";
import { colorSchemes } from "./MaterialDesignColorScheme";
import { ChartWidget, cardGroup, legendGroup, tooltipGroup, type ChartSpec } from "./MaterialDesignChartCanvas";
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
// vis-2 stores row 0 of an indexed group under the plain base name, higher rows as `${name}${i}`.
export const item = (d: Data, key: string, i: number): unknown => { const v = d[`${key}${i}`]; return v !== undefined ? v : (i === 0 ? d[key] : undefined); };
const TIME_UNITS: Array<[string, number]> = [
  ["year", 365 * 86400000], ["quarter", 90 * 86400000], ["month", 28 * 86400000], ["week", 7 * 86400000],
  ["day", 86400000], ["hour", 3600000], ["minute", 60000], ["second", 1000],
];

// vis-materialdesign saved this field as chart.js v2 `displayFormats` JSON, one format per unit.
export function timeFormatFor(setting: string, step: number): string {
  if (!setting.startsWith("{")) return setting || "HH:mm";
  let formats: unknown;
  try { formats = JSON.parse(setting); } catch { return "HH:mm"; }
  const unit = !(step > 0) ? "minute" : TIME_UNITS.find(([, size]) => step >= size)?.[0] ?? "millisecond";
  const format = formats && typeof formats === "object" && !Array.isArray(formats) ? (formats as Record<string, unknown>)[unit] : undefined;
  return typeof format === "string" && format ? format : "HH:mm";
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
      // Declared last so it lands at the end of the group, the way the other three charts have it.
      num("animationDuration"),
    ],
  },
  cardGroup(),
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
  legendGroup({ shown: true }),
  {
    name: "xAxisLayout",
    label: "group_xAxisLayout",
    fields: [
      { name: "xAxisTimeFormats", label: "xAxisTimeFormats", type: "text" },
      color("xAxisValueLabelColor"),
      { name: "xAxisValueFontFamily", label: "xAxisValueFontFamily", type: "fontname" as const },
      num("xAxisValueFontSize"),
      {
        name: "xAxisShowGridLines",
        label: "xAxisShowGridLines",
        type: "checkbox",
        default: true,
      },
      color("xAxisGridLinesColor"),
    ],
  },
  tooltipGroup(),
  {
    name: "yAxisLayout",
    label: "group_yAxisLayout",
    fields: [color("yAxisTitleColor"), { name: "yAxisTitleFontFamily", label: "yAxisTitleFontFamily", type: "fontname" }, num("yAxisTitleFontSize"), color("yAxisValueLabelColor"), { name: "yAxisValueFontFamily", label: "yAxisValueFontFamily", type: "fontname" }, num("yAxisValueFontSize")],
  },
];

export default class MaterialDesignChartLineHistory extends ChartWidget {
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
  componentDidUpdate(prevProps: typeof this.props, prevState: typeof this.state): void {
    super.componentDidUpdate(prevProps, prevState);
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
    const method = s(d.refreshMethod, "timeInterval");
    return JSON.stringify({
      d,
      time: stateValue(this.state, s(d.time_interval_oid)),
      // `byObject` is the mode that refreshes on the trigger state; the other two must not see
      // it, or a write to the trigger would re-query on top of their own schedule.
      trigger:
        method === "byObject"
          ? stateValue(this.state, s(d.manualRefreshTrigger))
          : undefined,
      // Only `realtime` re-queries the history adapter when a live value arrives. With the
      // values unconditionally in the key, `timeInterval` fired on every value change instead
      // of on its interval, and `byObject` never waited for its trigger at all - the setting
      // could only ever add refreshes, never restrict them.
      values:
        method === "realtime"
          ? Array.from({ length: count }, (_, i) =>
              stateValue(this.state as VisRxWidgetState, s(item(d, "oid", i))),
            )
          : undefined,
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
  chartSpec(d: Data, _value?: unknown): ChartSpec {
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
      labelFontFamily: s(d.xAxisValueFontFamily),
      labelFontSize: n(d.xAxisValueFontSize),
      gridDisplay: b(d.xAxisShowGridLines, true),
      gridColor: s(d.xAxisGridLinesColor, isM3 ? m3.grid : ""),
      tickCallback: (value, _index, ticks) => fmtTime(value, timeFormatFor(timeFmt, Math.abs(Number(ticks?.[1]?.value) - Number(ticks?.[0]?.value)))),
    });
    const scales: Record<string, unknown> = { x: xAxis, ...Object.fromEntries(yEntries) };
    // chart.js v4 hard-crashes (vScale undefined) if a dataset references a y-axis id with no scale;
    // series indices can diverge from configured rows (sparse oids).
    this.series.forEach((_series, i) => { const id = yAxisIdOf(i); if (!(id in scales)) scales[id] = { axis: "y", type: "linear", position: "left" }; });
    const series = this.series.map(entry => ({ ...entry, points: entry.points.filter(point => point.val !== null) }));
    return {
      type: "line",
      colorBy: "dataset",
      datasets: series.map((entry, i) => {
        // Value labels are per series here, so they ride on the dataset.
        const fields: Data = { designStyle: d.designStyle };
        for (const key of ["showValues", "valuesSteps", "valuesMinDecimals", "valuesMaxDecimals", "valuesAppendText", "valuesFontColor", "valuesFontFamily", "valuesFontSize", "valuesBackgroundColor", "valuesBorderColor", "valuesBorderWidth", "valuesBorderRadius"]) fields[key] = item(d, key, i);
        return {
          label: s(item(d, "legendText", i), entry.oid),
          values: entry.points.map(point => point.val),
          x: entry.points.map(point => point.ts),
          colors: [s(item(d, "dataColor", i)) || undefined],
          valueLabels: { fields, align: "top" as const, anchor: "end" as const },
          extra: ([color]: string[]) => ({
            backgroundColor: b(item(d, "useFillColor", i)) ? s(item(d, "fillColor", i), `${color}33`) : "transparent",
            fill: b(item(d, "useFillColor", i)),
            borderWidth: n(item(d, "lineThikness", i), 2),
            stepped: b(item(d, "steppedLine", i)),
            tension: 0,
            pointBackgroundColor: s(item(d, "pointColor", i), color),
            pointRadius: n(d.pointSize, 3),
            yAxisID: yAxisIdOf(i),
            spanGaps: b(item(d, "lineSpanGaps", i), true),
          }),
        };
      }),
      scales,
      valueLabel: (point, _number, fallback) => ({ ...fallback, color: fallback.color || point.color }),
      tooltip: { title: point => fmtTime(point.x, timeFmt || "lll") },
    };
  }
}
