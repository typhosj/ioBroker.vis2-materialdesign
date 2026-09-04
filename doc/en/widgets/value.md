# Value

[User guide](../README.md) › [Widget catalog](README.md) · [Deutsch](../../de/widgets/value.md)

Displays an ioBroker state as text, number, boolean or linked value, with
formatting, prefix/suffix and optional icon. Template id:
`tplVis2-materialdesign-value`.

One widget shows exactly one state. For several values below each other in a
single widget use the [List](list.md) with bindings in its row texts, see
[Show values inside texts](../README.md#show-values-inside-texts).

<img src="../../media/vis2_value_runtime.png" alt="Material Design value in VIS 2">

## Editor settings

The screenshots show the groups that shape the output. Settings not listed below
are self-explanatory. The editor UI follows the ioBroker system language, so the
screenshots are German.

<img src="../../media/vis2_value_editor_overview.png" width="340" alt="Value general and number format">

**Common**

- **target type** – how the state is interpreted: `automatic`, `number`, `string`, `boolean` or `linked` (a clickable value opening the object).
- **override text** – replaces the finished output with your own text, in which `#value` stands for the formatted value, e.g. `Counter: #value`. If the output contains pipe characters, the parts are available individually as `#value[0]`, `#value[1]`, …

**layout**

- **text prepanded / appended text** – fixed text before and after the value (a unit, a label), each with its own color, font and size.
- **textAlign** – `start`, `center` or `end`.
- **distance label** – gap in pixels between icon, text and value (default 4).

**number formatting**

- **minimal / maximal decimals** – number of fractional digits shown.
- **unit** – unit text appended to the number.
- **calculate** – math expression applied to the value before display. The value is available as `#value`, e.g. `#value/1000` for Wh → kWh. An expression without `#value` is not evaluated.
- **convert seconds to duration** – template built from the letters `d`, `h`, `m`, `s` (doubled = two digits), e.g. `hh:mm:ss`. The largest unit used collects the overflow: `mm:ss` shows `120:00` for two hours. Text in square brackets stays literal — needed for unit words whose letters would otherwise count as template letters: `hh:mm [hrs]`. The special value `humanize` writes the duration out in the interface language, rounded to the largest fitting unit (`2 hours`, `45 seconds`).
- **convert timestamp to datetime** – expects **seconds** since 1970, not milliseconds. Template built from `YYYY`, `YY`, `MMMM`, `MMM`, `MM`, `M`, `DD`, `D`, `dddd`, `ddd`, `dd`, `HH`, `H`, `hh`, `h`, `mm`, `m`, `ss`, `s`, `A`, `a`; square brackets stay literal again. Left empty, the browser's own date and time format applies.

<img src="../../media/vis2_value_editor_2.png" width="340" alt="Value icon options">

**icon**

- **Image** – Material Design icon name, image path/URL or data URL shown next to the value.
- **image position** – before or after the value.
- **image color / image height** – recolor (single-color SVG) and size of the icon.

**boolean formatting**

- **text if true / text if false** – what is shown instead of `true` and `false`.
- **Condition** – expression using the same `#value` placeholder as the calculation, deciding the true/false state for non-boolean inputs, e.g. `#value > 20`. Without `#value` nothing is evaluated; without a condition, `true`, `"true"`, `1` and `"1"` count as true.

**linked value**

- **Hidden on load** – the widget stays invisible until the state has arrived for the first time.

**value change effect**

- **enabled** – briefly highlights the value on every change, with its own **font color**, **font size** and **effect duration** (default 750 ms). The effect color wins while it lasts.

The **layout**, **boolean formatting**, **linked value** and **value change
effect** groups only appear with **show advanced options** — regardless of the
target type. A widget that already carries such values shows them without the
switch.

## Design style

The **Classic** (left) and **Material 3** (right) style side by side, see
[Design style](../README.md#design-style): a number with unit, a boolean as
text, text with a prefix, a value with icon, right aligned, plus the Icon widget
small, large and recolored.

<img src="../../media/vis2_value_styles.png" alt="Value and icon in the Classic and the Material 3 style">

The same widgets with the dark theme switched on:

<img src="../../media/vis2_value_styles_dark.png" alt="Value and icon in the Classic and the Material 3 style, dark theme">
