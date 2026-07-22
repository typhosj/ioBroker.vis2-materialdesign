# Bar chart

[User guide](../README.md) › [Widget catalog](README.md) › [Charts](charts.md) · [Deutsch](../../de/widgets/chart-bar.md)

Compares current values as vertical or horizontal bars.
Template id: `tplVis2-materialdesign-Chart-Bar`.

## Data source

- **Editor input:** each dataset references its own state. Dataset count creates the indexed groups.
- **JSON string/object:** Object ID references a state containing a JSON array. Datasets and their presentation come from that state.
- **Chart type:** horizontal swaps category and value axes; min/max still apply to the value axis.

With editor input, each dataset group contains an Object ID, axis label,
optional color, replacement value text and tooltip texts. Without fixed axis
limits, the widget scales automatically and includes zero.

## Editor settings

The editor UI follows the ioBroker system language, so the screenshots are
German. Settings not listed below are self-explanatory.

<img src="../../media/vis2_chart_bar_editor.png" width="340" alt="Bar chart general and bar layout options">

- **General** – data source (editor datasets or one JSON state), dataset count, object id and **chart type** (vertical or horizontal). Per editor dataset, an indexed group adds its object id, axis label, color and tooltip texts.
- **Bar chart layout** – bar thickness and spacing.

<img src="../../media/vis2_chart_bar_editor_2.png" width="340" alt="Bar chart axis and tooltip options">

- **Y axis** – axis title, position (left / right), gridlines and axis/label visibility. The value-axis **minimum / maximum** live in the Chart layout group (empty = automatic scaling).
- **Tooltip** – enable the tooltip and set its colors; a per-dataset `tooltipText` overrides the generated text.

The shared **Chart layout**, **Legend** and color-scheme groups from
[Charts](charts.md) apply here too.

## JSON format

The state must contain an array. Missing presentation values fall back to the
color scheme and global widget settings.

| Property | Meaning |
| --- | --- |
| `label` | category-axis label |
| `value` | numeric bar value |
| `dataColor` | color of this bar |
| `valueText` | custom value text in the automatically generated tooltip |
| `valueAppendix` | suffix after the tooltip value text |
| `tooltipTitle` | custom tooltip title |
| `tooltipText` | custom tooltip body |

```json
[
    { "label": "PV", "value": 4.8, "dataColor": "#f9a825", "valueAppendix": " kW" },
    { "label": "Grid", "value": 1.2, "dataColor": "#44739e", "tooltipTitle": "Grid import" }
]
```

## Relevant layout options

- Minimum and maximum constrain the value axis. Empty fields retain automatic scaling.
- Per-dataset tooltip text replaces the automatically generated label.
- Horizontal presentation functionally swaps X and Y axes: X contains values, Y contains categories.
