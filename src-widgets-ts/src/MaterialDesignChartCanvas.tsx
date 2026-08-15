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
  if (callbacks) config.callbacks = callbacks;
  return config;
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
