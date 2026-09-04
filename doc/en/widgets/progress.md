# Progress

[User guide](../README.md) › [Widget catalog](README.md) · [Deutsch](../../de/widgets/progress.md)

A linear VIS 2 progress indicator for numeric or boolean states. Template id:
`tplVis2-materialdesign-Progress`.

<img src="../../media/vis2_progress_runtime.png" alt="Linear Material Design progress in VIS 2">

## Editor settings

The screenshot shows the **General**, **layout** and **labeling** groups
expanded. Settings not listed below are self-explanatory. The editor UI follows
the ioBroker system language, so the screenshots are German.

<img src="../../media/vis2_progress_editor_overview.png" width="340" alt="Progress general, layout and label options">

**General**

- **Minimum / Maximum** – map the state value onto 0–100 percent. A boolean state
  counts `true` as the maximum and `false` as the minimum; values outside the
  range are clamped.
- **Reverse** – fills from the opposite side.
- **invert value** – fills the bar to the remaining percentage; the label keeps
  showing the reached one.

**layout**

- **rounded corners** – rounds the ends of the bar.
- **indeterminate - continuously animates** – a permanent animation that ignores
  the value (busy indicator).
- **rotate 90 degrees** – `yes` stands the bar upright.

**labeling**

- **show value** – hides the label inside the bar.
- **value caption style** – `percent`, `value` (the state value plus **unit**) or
  `custom`.
- **custom label** – free text for the `custom` style. `[#value]` inserts the
  state value, `[#percent]` the percentage, e.g. `[#value] of 500 W ([#percent] %)`.
- **decimal points** – decimals of both numbers.
- **text alignment** – `start`, `center` or `end`.

**colors**

- **color progress / background color** – the bar and its track.
- **condition for color 1 progress [>] / color 1 progress** and the same pair for
  color 2 – the condition is a **percentage**, not the state value: above the
  first condition color 1 applies, above the second color 2.

The **striped** group turns on and styles a stripe pattern (**striped**,
**Stripe angle**, three stripe widths and **Stripe distance**).

## Design style

The **Classic** (left) and **Material 3** (right) style side by side, see
[Design style](../README.md#design-style): the linear bar at low, medium and
high values, square and striped, indeterminate, plus the circular variant
determinate, thick and indeterminate.

<img src="../../media/vis2_progress_styles.png" alt="Progress in the Classic and the Material 3 style">

The same widgets with the dark theme switched on:

<img src="../../media/vis2_progress_styles_dark.png" alt="Progress in the Classic and the Material 3 style, dark theme">
