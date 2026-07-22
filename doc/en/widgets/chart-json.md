# JSON chart

[User guide](../README.md) › [Widget catalog](README.md) › [Charts](charts.md) · [Deutsch](../../de/widgets/chart-json.md)

Builds a bar, line or mixed chart from one JSON state.
Template id: `tplVis2-materialdesign-Chart-JSON`.

## Data format

The state selected under Object ID must contain an object with `axisLabels` and
`graphs`. `axisLabels` names shared positions on the X axis. Each entry in
`graphs` creates one dataset.

```json
{
    "axisLabels": ["Mon", "Tue", "Wed", "Thu"],
    "graphs": [
        {
            "type": "bar",
            "legendText": "Consumption",
            "color": "#44739e",
            "data": [4.2, 5.1, 4.8, 6.0],
            "barIsStacked": true,
            "barStackId": 1
        },
        {
            "type": "line",
            "legendText": "PV",
            "color": "#f9a825",
            "data": [2.1, 4.7, null, 5.4],
            "line_spanGaps": false,
            "line_Thickness": 3
        }
    ]
}
```

Invalid JSON displays `Error in JSON string`. Missing, empty or non-numeric
data values are treated as gaps.

## Editor settings

Most of this chart is driven by the JSON state; the editor only sets the source
and global defaults. The editor UI follows the ioBroker system language, so the
screenshot is German.

<img src="../../media/vis2_chart_json_editor.png" width="340" alt="JSON chart general and chart layout options">

- **General** – the object id of the JSON state described above and the global **chart type** (`bar` or `line`) used by datasets without their own `type`.

The card layout, shared **Legend**, **Tooltip** and axis groups from
[Charts](charts.md) apply;
per-dataset appearance comes from the JSON properties below.

## Dataset properties

| Property | Meaning |
| --- | --- |
| `data` | values matching `axisLabels` order; number or `{ "y": number }` |
| `type` | `bar` or `line`; overrides the global chart type |
| `legendText` | label shown in the legend |
| `color` | line or bar color |
| `line_Thickness` | line width; also fallback for the bar border width |
| `line_steppedLine` | connects line values using steps |
| `line_spanGaps` | connects points across `null` gaps |
| `line_UseFillColor` | fills the area below a line |
| `line_FillColor` | custom fill color; otherwise a transparent variant of `color` |
| `barBorderWidth` | bar border width |
| `barIsStacked` | enables stacking for the dataset and its Y axis |
| `barStackId` | datasets with the same ID form one stack |
| `yAxis_id` | datasets with the same ID share a Y axis; omitted values all use ID `0` |
| `yAxis_position` | places this Y axis on the left or right |
| `yAxis_min`, `yAxis_max` | fixed limits for this Y axis; empty values retain automatic scaling |

## Mixed charts and axes

The global chart type applies only to datasets without their own `type`. This
allows bars and lines in one chart. Stacked bars need the same `barStackId`;
datasets without stacking remain separate.

Assign different `yAxis_id` values to different units, for example `0` for kW
on the left and `1` for percent on the right. Datasets with the same unit should
share an ID to avoid duplicate axes.

The widget uses `axisLabels` as categories. Use
[Line history chart](chart-line-history.md) for a real time axis loaded directly
from a history instance.
