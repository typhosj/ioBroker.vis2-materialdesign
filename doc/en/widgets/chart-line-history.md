# Line history chart

[User guide](../README.md) › [Widget catalog](README.md) › [Charts](charts.md) · [Deutsch](../../de/widgets/chart-line-history.md)

Loads multiple time series from an ioBroker history instance.
Template id: `tplVis2-materialdesign-Chart-Line-History`.

Requires a configured History, SQL or InfluxDB instance and enabled recording
for every state used by the widget.

## Time range and refresh

- **History adapter instance:** source of all time series.
- **Time interval to show:** rolling window ending at the current time.
- **Control interval with object:** overrides the fixed window at runtime.
- **Refresh:** in real time, at a fixed interval or through a trigger object.
- **Chart timeout:** maximum wait for the history request in seconds.

These options live in the **General** group. The editor UI follows the ioBroker
system language, so the screenshots are German.

<img src="../../media/vis2_chart_line_history_editor.png" width="340" alt="Line history general options">

The state under “Control interval with object” accepts two value types:

- String: an offered interval label such as `30 seconds`, `10 minutes`, `1 day` or `1 year`.
- Number: start time as a Unix timestamp in milliseconds. The end remains the current time.

Changing the manual trigger state starts a new request; its actual value does
not matter. Interval refresh uses at least one second even if a lower value is
configured.

## Datasets and history request

Each indexed group describes one recorded state and its query. Presentation
options with the same index belong to that time series. Without custom legend
text, the Object ID is displayed.

<img src="../../media/vis2_chart_line_history_editor_2.png" width="340" alt="Line history dataset and line options">


| Setting | Effect |
| --- | --- |
| Object ID | state with enabled history recording |
| Aggregate | passes `minmax`, `min`, `max`, `average` or `total` to the history instance |
| Maximum data points | limits returned point count; default 50 for `minmax`, otherwise 100 |
| Minimum time interval | query step in seconds; empty or `0` lets the history instance decide |
| Multiply | converts every valid value before display, for example `0.001` from W to kW |

Non-numeric and `null` values are omitted. The chart remains empty when no
history instance is selected or the history API is unavailable. For timeouts,
check recording and the selected range first, then increase Chart timeout.

## Lines and axes

- `steppedLine` draws state changes as steps instead of direct connections.
- Fill color shades the area below a line; without a custom fill color, a transparent line color is used.
- Newly configured datasets share one Y axis by default. Its position, title and limits come from the first dataset group. Empty min/max fields retain automatic scaling.
- X-axis time format uses Moment format tokens, for example `HH:mm` for a 24-hour display. The same format is applied to seconds, minutes, hours and days.
- Tooltip mode `index` compares datasets at the same X value; `nearest` shows the closest point.
