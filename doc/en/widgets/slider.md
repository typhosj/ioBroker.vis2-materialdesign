# Slider

[User guide](../README.md) › [Widget catalog](README.md) · [Deutsch](../../de/widgets/slider.md)

A horizontal or vertical native VIS 2 slider that reads and writes a numeric
state. Template id: `tplVis2-materialdesign-Slider`.

<img src="../../media/vis2_slider_runtime.png" alt="Material Design slider in VIS 2">

## Editor settings

The screenshots show the groups that shape behaviour and labelling. Settings not
listed below are self-explanatory. The editor UI follows the ioBroker system
language, so the screenshots are German.

<img src="../../media/vis2_slider_editor_overview.png" width="340" alt="Slider general and scale options">

**General**

- **oid** – the value state; **working object ID** optionally reports that a device is still moving to the target.
- **orientation** (`horizontal`, `vertical`) and **invert slider** – inverted direction.
- **min / max / step** – value range and increment, 0, 100 and 1 by default. If min equals max, the widget uses min + 100.
- **Read only** – shows the value but never writes it.
- **Send value on release** – writes once at the end instead of while dragging.
- **knob size** – `small`, `medium` or `big`, for touchscreen use.

**Scale (ticks)**

- **show steps** – `don't display`, `show when operated` or `always show`.
- **text of steps (comma separated)** – the tick captions, e.g. `off, half, full`. The number of captions also decides how many ticks are drawn; without captions it follows min, max and step.

<img src="../../media/vis2_slider_editor_2.png" width="340" alt="Slider label and thumb label options">

**Label**

- **text prepanded** – caption shown left of the slider, with its own width, color and font.
- **show value** (on by default), **value caption style** (`value` or `percent`) and **unit** – the number beside the slider. **distance label** is its width in pixels (default 50).
- **text for value less or equal than minimum / maximum** – fixed text at the two ends instead of the number. The second field applies at the maximum; the editor label is misleading.
- **'smaller than' condition for the text of the value** / **text for 'smaller than'** and the "greater than" counterpart – replace the number below or above a limit, e.g. "off" under 1.

**layout of the controller label**

- **show label** – `don't display`, `show when operated` or `always show`.
- **use rules of the text** – the thumb label reuses the replacement texts of the value caption; without it, it always shows the bare number.
- Thumb size, background and font colors follow.

## Design style

The **Classic** (left) and **Material 3** (right) style side by side, see
[Design style](../README.md#design-style): the horizontal slider with value
label, ticks and thumb label, read-only, vertical, plus the round slider at 360°
and 270° and read-only.

<img src="../../media/vis2_slider_styles.png" alt="Slider and round slider in the Classic and the Material 3 style">

The same widgets with the dark theme switched on:

<img src="../../media/vis2_slider_styles_dark.png" alt="Slider and round slider in the Classic and the Material 3 style, dark theme">
