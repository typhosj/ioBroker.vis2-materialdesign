# Buttons Vertical

[User guide](../README.md) › [Widget catalog](README.md) · [Deutsch](../../de/widgets/buttons-vertical.md)

Vertical counterparts of all six button actions. Icon and label are arranged
vertically while action and state behaviour matches the normal buttons.

Template ids use the suffix `-vertical`, for example
`tplVis2-materialdesign-Button-Toggle-vertical`.

<img src="../../media/vis2_buttons_vertical_runtime.png" alt="Vertical Material Design buttons in VIS 2">

## Editor settings

The screenshot shows the **Common**, **labeling** and **icon** groups
expanded. Settings not listed below are self-explanatory. The editor UI follows
the ioBroker system language, so the screenshots are German.

<img src="../../media/vis2_buttons_vertical_editor_overview.png" width="340" alt="Vertical button general, label and icon options">

**Common** – the action fields match the corresponding normal
[button](buttons.md) (Navigation, Link, State, Multi State, Addition, Toggle).

**labeling**

- **alignment** – horizontal alignment of icon and text inside the column: left,
  center (default) or right. Their order is set by **image position** in the
  **icon** group instead.
- **distance between text and image** – spacing between the icon and the
  caption, 2 px by default.
- **Button text / Label true** – caption; a second text can be shown in the on
  state.

The **text width** of the horizontal buttons does not exist here — in a column
the caption uses the full width.

**icon**

- **Image** – Material Design icon name or image source, plus **active image**
  for the on state.
- **image color / active image color** – recolor a single-color icon, with a
  separate color for the on state.
- **image position** – `top` (default) or `bottom`, so the icon sits above or
  below the text.
- **image height** – icon size, 26 px by default.

The **colors** and **Locking** groups only appear once **show advanced options**
is ticked in **Common**. Vibration and the click sound have no group of their
own — they sit at the bottom of **Common**.

## Design style

The **Classic** (left) and **Material 3** (right) style side by side, see
[Design style](../README.md#design-style): the vertical filled, tonal, elevated,
outlined and text containers, a toggle in the on state, read-only and locked.

<img src="../../media/vis2_buttons_vertical_styles.png" alt="Vertical buttons in the Classic and the Material 3 style">

The same widgets with the dark theme switched on:

<img src="../../media/vis2_buttons_vertical_styles_dark.png" alt="Vertical buttons in the Classic and the Material 3 style, dark theme">
