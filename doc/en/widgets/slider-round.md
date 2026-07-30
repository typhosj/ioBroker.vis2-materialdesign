# Slider Round

[User guide](../README.md) › [Widget catalog](README.md) · [Deutsch](../../de/widgets/slider-round.md)

A circular native VIS 2 slider for numeric states. Template id:
`tplVis2-materialdesign-Slider-Round`.

<img src="../../media/vis2_slider_round_runtime.png" alt="Round Material Design slider in VIS 2">

## Editor settings

The screenshot shows the **General** and **Label** groups expanded. Settings not
listed below are self-explanatory. The editor UI follows the ioBroker system
language, so the screenshots are German.

<img src="../../media/vis2_slider_round_editor_overview.png" width="340" alt="Round slider general and label options">

**General**

- **oid** – value state; **oid-working** optionally reports that a device is still moving.
- **min / max / step** – value range and increment.
- **start angle / arc length** – where the circular track begins and how far it sweeps.
- **slider width / handle size** – stroke thickness and knob size.
- **rtl** – reverses the direction (counter-/clockwise).
- **read only** – shows the value without accepting input.

**Label**

- **value label style / unit** – raw value or percent, plus a unit suffix.
- **vertical position** – places the value label in the center.
- **min / max texts** and **less-than / greater-than replacement texts** – show fixed text below/above a limit instead of the number.

The **Colors** group controls the track background, the active arc (before/after
the knob) and the knob itself.

## Design style

The **Classic** (left) and **Material 3** (right) style side by side, see
[Design style](../README.md#design-style): the horizontal slider with value
label, ticks and thumb label, read-only, vertical, plus the round slider at 360°
and 270° and read-only.

<img src="../../media/vis2_slider_styles.png" alt="Slider and round slider in the Classic and the Material 3 style">

The same widgets with the dark theme switched on:

<img src="../../media/vis2_slider_styles_dark.png" alt="Slider and round slider in the Classic and the Material 3 style, dark theme">
