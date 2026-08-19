import React, { useEffect, useRef } from "react";
import Chart from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

// Default all chart text (axis ticks + axis titles) to the Material Design
// blue instead of chart.js' grey #666, matching the widget theme. Per-axis
// color fields still override this. Datalabels/legend set their own colors.
Chart.defaults.global.defaultFontColor = "#44739e";

// chart.js paints the canvas, never the plot rectangle, so `chartAreaBackgroundColor` needs a
// plugin of its own. Reads `options.plugins.mdwChartArea.color`.
const chartAreaBackground = {
  id: "mdwChartArea",
  beforeDraw(chart: { chartArea?: { left: number; top: number; right: number; bottom: number }; ctx?: CanvasRenderingContext2D }, _easing: unknown, options: { color?: unknown }): void {
    const color = typeof options?.color === "string" ? options.color : "";
    const area = chart.chartArea;
    if (!color || !area || !chart.ctx) return;
    chart.ctx.save();
    chart.ctx.fillStyle = color;
    chart.ctx.fillRect(area.left, area.top, area.right - area.left, area.bottom - area.top);
    chart.ctx.restore();
  },
};

// The tooltip options were declared on every chart widget but never handed to chart.js, so only
// `showTooltip` did anything. Unset entries are left out, otherwise they overwrite chart.js defaults.
export function tooltipConfig(data: Record<string, unknown>, callbacks?: object): object {
  const num = (value: unknown): number | undefined => (value === "" || value === null || value === undefined || !Number.isFinite(Number(value)) ? undefined : Number(value));
  const str = (value: unknown): string | undefined => (typeof value === "string" && value ? value : undefined);
  const enabled = data.showTooltip === undefined || data.showTooltip === null || data.showTooltip === ""
    ? true
    : data.showTooltip === true || data.showTooltip === "true" || data.showTooltip === 1 || data.showTooltip === "1";
  const config: Record<string, unknown> = { enabled, mode: str(data.tooltipMode) || "nearest" };
  const put = (key: string, value: unknown): void => { if (value !== undefined) config[key] = value; };
  put("position", str(data.tooltipPosition));
  put("bodyAlign", str(data.tooltipBodyAlignment));
  put("backgroundColor", str(data.tooltipBackgroundColor));
  put("titleFontColor", str(data.tooltipTitleFontColor));
  put("bodyFontColor", str(data.tooltipBodyFontColor));
  put("titleFontFamily", str(data.tooltipTitleFontFamily));
  put("bodyFontFamily", str(data.tooltipBodyFontFamily));
  put("titleFontSize", num(data.tooltipTitleFontSize));
  put("bodyFontSize", num(data.tooltipBodyFontSize));
  put("caretSize", num(data.tooltipArrowSize));
  put("caretPadding", num(data.tooltipDistanceToBar));
  put("cornerRadius", num(data.tooltipBoxRadius));
  put("xPadding", num(data.tooltipXpadding));
  put("yPadding", num(data.tooltipYpadding));
  put("titleMarginBottom", num(data.tooltipTitleMarginBottom));
  if (data.tooltipShowColorBox !== undefined && data.tooltipShowColorBox !== null && data.tooltipShowColorBox !== "") {
    config.displayColors = data.tooltipShowColorBox === true || data.tooltipShowColorBox === "true" || data.tooltipShowColorBox === 1 || data.tooltipShowColorBox === "1";
  }
  if (callbacks) config.callbacks = callbacks;
  return config;
}

// Value labels on the drawn element (chartjs-plugin-datalabels). Every chart passes its own text
// and color per item, the rest of the look comes from the `values*` fields.
// `valuesSteps` thins the labels out (every n-th item); 0/1 shows all.
export function datalabelsConfig(
  data: Record<string, unknown>,
  label: (index: number) => { text: string; color?: string },
  defaults: { align: string; anchor: string },
): object {
  const num = (value: unknown, fallback = 0): number => (value === "" || value === null || value === undefined || !Number.isFinite(Number(value)) ? fallback : Number(value));
  const str = (value: unknown, fallback = ""): string => (typeof value === "string" && value ? value : fallback);
  const show = str(data.showValues, "showValuesOn");
  const steps = Math.max(1, num(data.valuesSteps, 1));
  const visible = show === "showValuesAuto" ? "auto" : true;
  type LabelContext = { dataIndex: number };
  return {
    align: str(data.valuesPositionAlign, defaults.align),
    anchor: str(data.valuesPositionAnchor, defaults.anchor),
    backgroundColor: str(data.valuesBackgroundColor) || null,
    borderColor: str(data.valuesBorderColor) || null,
    borderRadius: num(data.valuesBorderRadius),
    borderWidth: num(data.valuesBorderWidth),
    color: (context: LabelContext): string => label(context.dataIndex).color || str(data.valuesFontColor, "#000"),
    display: show === "showValuesOff" ? false : (context: LabelContext): boolean | string => (context.dataIndex % steps === 0 ? visible : false),
    font: { family: str(data.valuesFontFamily) || undefined, size: num(data.valuesFontSize, 12) },
    formatter: (_value: unknown, context: LabelContext): string => label(context.dataIndex).text,
    offset: num(data.valuesPositionOffset, 4),
    rotation: num(data.valuesRotation),
    textAlign: str(data.valuesTextAlign, "center"),
  };
}

// `chartPadding*` in px around the plot. Only sides that are set are emitted, so chart.js keeps
// its own spacing for the rest.
export function layoutConfig(data: Record<string, unknown>): object | undefined {
  const num = (value: unknown): number | undefined => (value === "" || value === null || value === undefined || !Number.isFinite(Number(value)) ? undefined : Number(value));
  const padding: Record<string, number> = {};
  for (const [side, key] of [["top", "chartPaddingTop"], ["left", "chartPaddingLeft"], ["right", "chartPaddingRight"], ["bottom", "chartPaddingBottom"]] as const) {
    const value = num(data[key]);
    if (value !== undefined) padding[side] = value;
  }
  return Object.keys(padding).length ? { padding } : undefined;
}

// `tooltipValueMin/MaxDecimals`. Undefined when the user set neither, so the caller keeps its own
// text — the bar label already carries the datalabel decimals, which are a different setting.
export function tooltipNumber(data: Record<string, unknown>, value: unknown): string | undefined {
  const num = (v: unknown): number | undefined => (v === "" || v === null || v === undefined || !Number.isFinite(Number(v)) ? undefined : Number(v));
  const min = num(data.tooltipValueMinDecimals);
  const max = num(data.tooltipValueMaxDecimals);
  const raw = num(value);
  if (raw === undefined || (min === undefined && max === undefined)) return undefined;
  return raw.toLocaleString(undefined, {
    minimumFractionDigits: Math.max(0, Math.min(20, min ?? 0)),
    maximumFractionDigits: Math.max(0, Math.min(20, max ?? Math.max(min ?? 0, 2))),
  });
}

// `data`/`options` are typed loosely: callers build chart.js v2 configs whose
// runtime shape (null data points for gaps, numeric stack ids) is wider than
// @types/chart.js allows. The strict typing is re-applied at the `new Chart` call.
type Props = { type: string; data: object; options: object };

export function MaterialDesignChartCanvas({ type, data, options }: Props): React.JSX.Element {
  const canvas = useRef<HTMLCanvasElement>(null);
  const chart = useRef<{ destroy(): void } | null>(null);
  useEffect(() => {
    if (!canvas.current) return;
    chart.current?.destroy();
    chart.current = new Chart(canvas.current, { type, data, options, plugins: [ChartDataLabels, chartAreaBackground] });
    return () => {
      chart.current?.destroy();
    };
  }, [type, data, options]);
  return <canvas className="materialdesign-chart-container" style={{ height: "100%", width: "100%" }} ref={canvas} />;
}
