import React from "react";
import { indexedFields, squarePreview, itemCount, RenderProps, VisWidget, createInfo, stateValue, sanitizeHtml, boolValue as b, numberValue as n, textValue as s } from './widgetUtils';
import type { RxWidgetInfo, VisRxWidgetState } from "@iobroker/types-vis-2";
import { colorSchemes, scheme } from "./MaterialDesignColorScheme";
import { MaterialDesignChartCanvas, datalabelsConfig, layoutConfig, tooltipConfig } from "./MaterialDesignChartCanvas";
import { chartAxis } from "./chartAxis";

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
// vis-2 stores the first row (index 0) of an indexed group under the plain
// base name (e.g. `yAxisTitle`), higher rows as `${name}${i}`. Prefer the
// suffixed key, fall back to the plain name for index 0 so editor edits to
// the first data set actually take effect.
const item = (d: Data, key: string, i: number) => { const v = d[`${key}${i}`]; return v !== undefined ? v : (i === 0 ? d[key] : undefined); };
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
      // Off by default: a history line carries hundreds of points, and a label on each one is a wall
      // of text. The other charts draw one label per bar or slice, where "on" makes sense.
      { name: "showValues", label: "showValues", type: "select", options: ["showValuesOn", "showValuesOff", "showValuesAuto"], default: "showValuesOff" },
      num("valuesSteps"),
      num("valuesMinDecimals"),
      num("valuesMaxDecimals"),
      { name: "valuesAppendText", label: "valuesAppendText", type: "text" },
      color("valuesFontColor"),
      { name: "valuesFontFamily", label: "valuesFontFamily", type: "fontname" },
      num("valuesFontSize"),
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
    // axes come from the configured data rows, NOT the loaded
    // series -- otherwise an empty history range yields no axis config and
    // chart.js falls back to a default axis that ignores show/position/etc.
    const on = (v: unknown): number | undefined => (v === undefined || v === null || v === "" || !Number.isFinite(Number(v)) ? undefined : Number(v));
    const rowIdx = Array.from({ length: itemCount(d.dataCount) }, (_v, i) => i);
    // unset commonYAxis -> id 0, so series share one y-axis instead of each
    // series getting its own axis by index.
    const yAxisIdOf = (i: number) => `yAxis_id_${n(item(d, "commonYAxis", i), 0)}`;
    // one axis config per distinct id (dedupe; else duplicate axis ids).
    const yAxes = rowIdx
      .filter(i => rowIdx.findIndex(j => yAxisIdOf(j) === yAxisIdOf(i)) === i)
      .map(i => chartAxis({
        id: yAxisIdOf(i), type: "linear",
        position: s(item(d, "yAxisPosition", i), "left"),
        display: b(item(d, "showYAxis", i), true),
        title: s(item(d, "yAxisTitle", i)),
        titleColor: s(d.yAxisTitleColor), titleFontFamily: s(d.yAxisTitleFontFamily), titleFontSize: on(d.yAxisTitleFontSize),
        labelColor: s(d.yAxisValueLabelColor), labelFontFamily: s(d.yAxisValueFontFamily), labelFontSize: on(d.yAxisValueFontSize),
        gridColor: s(item(d, "yAxisGridLinesColor", i)),
        min: on(item(d, "yAxisMinValue", i)), max: on(item(d, "yAxisMaxValue", i)), stepSize: on(item(d, "yAxisStep", i)),
      }));
    // moment format for the x-axis tick labels; without it chart.js defaults
    // to 12h (e.g. "7AM"). Applied to the sub-day units so hour/minute ticks
    // follow the chosen format (e.g. "HH:mm" for 24h).
    const timeFmt = s(d.xAxisTimeFormats);
    const xAxes = [chartAxis({
      type: "time",
      labelColor: s(d.xAxisValueLabelColor),
      labelFontFamily: s(d.xAxisValueFontFamily),
      labelFontSize: n(d.xAxisValueFontSize),
      gridDisplay: b(d.xAxisShowGridLines, true),
      gridColor: s(d.xAxisGridLinesColor),
      time: timeFmt ? { tooltipFormat: "lll", displayFormats: { second: timeFmt, minute: timeFmt, hour: timeFmt, day: timeFmt } } : { tooltipFormat: "lll" },
    })];
    // Without a label callback the tooltip prints chart.js' raw default, so the decimals and the
    // appended unit configured right next to it stayed dead.
    const tipMin = Math.max(0, n(d.tooltipValueMinDecimals));
    const tipMax = Math.max(tipMin, n(d.tooltipValueMaxDecimals, 2));
    const tooltipLabel = (tip: { datasetIndex?: number; yLabel?: number; value?: string }, chartData: { datasets?: { label?: string }[] }): string => {
      const raw = tip.yLabel !== undefined ? Number(tip.yLabel) : Number(tip.value);
      const value = (Number.isFinite(raw) ? raw : 0).toLocaleString(undefined, { maximumFractionDigits: tipMax, minimumFractionDigits: tipMin });
      return `${s(chartData.datasets?.[n(tip.datasetIndex)]?.label)}: ${value}${s(d.tooltipBodyAppend)}`;
    };
    // The value labels are configured per data set (own decimals, unit, font, box), so each series
    // gets its own datalabels block instead of one chart-wide one.
    const seriesLabels = (series: { points: { val: number | null }[] }, i: number): object => {
      const points = series.points.filter(point => point.val !== null);
      const minDigits = Math.max(0, n(item(d, "valuesMinDecimals", i)));
      const maxDigits = Math.max(minDigits, n(item(d, "valuesMaxDecimals", i), 2));
      return datalabelsConfig({
        showValues: item(d, "showValues", i),
        valuesSteps: item(d, "valuesSteps", i),
        valuesFontColor: item(d, "valuesFontColor", i),
        valuesFontFamily: item(d, "valuesFontFamily", i),
        valuesFontSize: item(d, "valuesFontSize", i),
        valuesBackgroundColor: item(d, "valuesBackgroundColor", i),
        valuesBorderColor: item(d, "valuesBorderColor", i),
        valuesBorderWidth: item(d, "valuesBorderWidth", i),
        valuesBorderRadius: item(d, "valuesBorderRadius", i),
      }, index => ({ text: `${n(points[index]?.val).toLocaleString(undefined, { minimumFractionDigits: minDigits, maximumFractionDigits: maxDigits })}${s(item(d, "valuesAppendText", i))}` }), { align: "top", anchor: "center" });
    };
    const chartjs = <MaterialDesignChartCanvas type="line" data={{ datasets: this.series.map((series, i) => ({ label: s(item(d, "legendText", i), series.oid), data: series.points.filter(point => point.val !== null).map(point => ({ t: point.ts, y: point.val })), borderColor: s(item(d, "dataColor", i), colors[i] || s(d.globalColor, "#44739e")), backgroundColor: b(item(d, "useFillColor", i)) ? s(item(d, "fillColor", i), `${s(item(d, "dataColor", i), colors[i] || s(d.globalColor, "#44739e"))}33`) : "transparent", fill: b(item(d, "useFillColor", i)), borderWidth: n(item(d, "lineThikness", i), 2), steppedLine: b(item(d, "steppedLine", i)), lineTension: 0, pointBackgroundColor: s(item(d, "pointColor", i), s(item(d, "dataColor", i), colors[i] || s(d.globalColor, "#44739e"))), pointRadius: n(d.pointSize, 3), spanGaps: b(item(d, "lineSpanGaps", i), true), yAxisID: yAxisIdOf(i), datalabels: seriesLabels(series, i) })) }} options={{ responsive: true, maintainAspectRatio: false, layout: layoutConfig(d), animation: { duration: n(d.animationDuration, 1000) }, legend: { display: false }, plugins: { datalabels: { display: false }, mdwChartArea: { color: s(d.chartAreaBackgroundColor) } }, tooltips: tooltipConfig(d, { label: tooltipLabel }), scales: { xAxes, yAxes } }} />;
    const legend = b(d.showLegend, true) ? (
      <div
        style={{
          color: s(d.legendFontColor),
          fontFamily: s(d.legendFontFamily),
          fontSize: n(d.legendFontSize, 14),
          flexShrink: 0,
        }}
      >
        {this.series.map((series, i) => (
          <span key={series.oid} style={{ display: "block" }}>
            <i
              style={{
                background: s(
                  item(d, "dataColor", i),
                  colors[i] || s(d.globalColor, "#44739e"),
                ),
                display: "inline-block",
                height: n(d.legendBoxWidth, 10),
                marginRight: 4,
                width: n(d.legendBoxWidth, 10),
              }}
            />
            {s(item(d, "legendText", i), series.oid)}
          </span>
        ))}
      </div>
    ) : null;
    const chartMain = b(d.cardUse) ? (
      <div className="materialdesign-html-card-container mdc-card" style={{ background: s(d.colorBackground), boxSizing: "border-box", display: "flex", flexDirection: "column", height: "100%", padding: n(d.borderDistance, 8), width: "100%" }}>
        <div style={{ background: s(d.colorTitleSectionBackground), color: s(d.colorTitle), fontFamily: s(d.titleFontFamily), fontSize: n(d.titleLayout) ? `${n(d.titleLayout)}px` : undefined }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(s(d.title)) }} />
        <div style={{ background: s(d.colorTextSectionBackground), flex: "1 1 0", minHeight: 0 }}>{chartjs}</div>
      </div>
    ) : chartjs;
    // shrink chart so the legend stays inside the widget frame.
    const chartBox = (
      <div style={{ flex: 1, minWidth: 0, minHeight: 0, position: "relative" }}>{chartMain}</div>
    );
    // top/left -> legend before chart; bottom/right -> after.
    const legendFirst = ["top", "left"].includes(s(d.legendPosition, "right"));
    const body = legendFirst ? (
      <>{legend}{chartBox}</>
    ) : (
      <>{chartBox}{legend}</>
    );
    return (
      <div
        className="materialdesign-widget materialdesign-chart"
        style={{
          background: s(d.backgroundColor),
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
