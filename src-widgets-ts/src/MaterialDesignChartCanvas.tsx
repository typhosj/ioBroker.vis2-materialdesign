import React, { useEffect, useRef } from "react";
import {
  Chart,
  BarController, LineController, PieController, DoughnutController,
  ArcElement, BarElement, LineElement, PointElement,
  CategoryScale, LinearScale,
  Filler, Legend, Title, Tooltip,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

// Chart.js 4 no longer auto-registers. Register only the pieces these 4 widgets use — bar/line/
// pie/doughnut controllers, their elements, the linear + category scales (no time scale: the Line
// History chart pre-formats its own tick labels, staying moment-free), and the legend/title/tooltip/
// fill plugins. This is deliberately NOT `chart.js/auto`, which would drag in the radar/polar/bubble/
// scatter/time/radial engine we never draw (~2x the gzip). Datalabels stays a per-chart plugin.
// Guard the call: the real bundler resolves chart.js' ESM entry correctly, but the vitest/jsdom
// resolver loads a build where these named exports are absent (Chart.register is not a function).
// Charts never render in the unit tests (they only exercise the pure data helpers), so skipping
// registration there is harmless; the browser build always registers.
if (typeof (Chart as { register?: unknown }).register === "function") {
  Chart.register(
    BarController, LineController, PieController, DoughnutController,
    ArcElement, BarElement, LineElement, PointElement,
    CategoryScale, LinearScale,
    Filler, Legend, Title, Tooltip,
  );
}

// Default all chart text (axis ticks + axis titles) to the Material Design blue
// instead of chart.js' grey #666, matching the legacy widget theme. Per-axis color
// fields (and the M3 render paths) still override this. v4 renamed the global from
// defaults.global.defaultFontColor to defaults.color.
Chart.defaults.color = "#44739e";

// `data`/`options` are typed loosely: callers build chart.js configs whose runtime
// shape (null data points for gaps, numeric stack ids) is wider than the strict
// types allow. The strict typing is re-applied at the `new Chart` call.
type Props = { type: string; data: object; options: object };

export function MaterialDesignChartCanvas({ type, data, options }: Props): React.JSX.Element {
  const canvas = useRef<HTMLCanvasElement>(null);
  const chart = useRef<Chart | null>(null);
  useEffect(() => {
    if (!canvas.current) return;
    chart.current?.destroy();
    try {
      chart.current = new Chart(canvas.current, {
        type: type as never,
        data: data as never,
        options,
        plugins: [ChartDataLabels],
      });
    } catch (error) {
      // A malformed config must not white-screen the whole vis view. Log the shape that failed
      // (scale ids vs the axis ids the datasets reference) so the mismatch is visible, then render
      // nothing. This turned the chart.js v4 migration's opaque "getBasePixel of undefined" into a
      // named, diagnosable failure.
      chart.current = null;
      const opt = options as { scales?: Record<string, { type?: string }> };
      const dsAxes = ((data as { datasets?: { xAxisID?: string; yAxisID?: string }[] }).datasets || []).map(
        d => ({ x: d.xAxisID, y: d.yAxisID }),
      );
      console.error("materialdesign chart render failed", error, {
        type,
        scales: opt.scales ? Object.keys(opt.scales) : undefined,
        datasetAxes: dsAxes,
      });
    }
    return () => {
      chart.current?.destroy();
    };
  }, [type, data, options]);
  return <canvas className="materialdesign-chart-container" style={{ height: "100%", width: "100%" }} ref={canvas} />;
}
