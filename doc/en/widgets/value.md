# Value

[User guide](../README.md) › [Widget catalog](README.md) · [Deutsch](../../de/widgets/value.md)

Displays an ioBroker state as text, number, boolean or linked value, with
formatting, prefix/suffix and optional icon. Template id:
`tplVis2-materialdesign-value`.

<img src="../../media/vis2_value_runtime.png" alt="Material Design value in VIS 2">

## Editor settings

The screenshots show the groups that shape the output. Settings not listed below
are self-explanatory. The editor UI follows the ioBroker system language, so the
screenshots are German.

<img src="../../media/vis2_value_editor_overview.png" width="340" alt="Value general and number format">

**General**

- **target type** – how the state is interpreted: `auto`, number, string, boolean or *linked* (a clickable value opening the object).
- **prefix / suffix** – fixed text before / after the value (a unit, a label).

**Number formatting**

- **min / max decimals** – number of fractional digits shown.
- **unit** – unit text appended to the number.
- **calculation** – math expression applied to the value before display (e.g. `x/1000` for Wh → kWh).
- **convert to duration / to timestamp** – render a number of seconds as `hh:mm:ss`, or a timestamp as a formatted date/time.

<img src="../../media/vis2_value_editor_2.png" width="340" alt="Value icon options">

**Icon**

- **image** – Material Design icon name, image path/URL or data URL shown next to the value.
- **icon position** – before or after the value.
- **icon color / height** – recolor (single-color SVG) and size of the icon.

A separate **Boolean formatting** group appears once the target type is boolean:
it holds the **text for true / false** and a **condition** value that decides the
true/false state for non-boolean inputs.

**Value change effect**

- **enabled** – every time the value changes it switches to the effect font
  color and font size for the configured **duration** (750 ms by default) and
  then returns. The first value is the state arriving, not a change, so a
  dashboard does not light up while it loads.

**Linked value**

- **hidden on load** – keeps the widget invisible until its state has arrived.
  It still holds its box, so the layout around it does not jump when the value
  appears.

