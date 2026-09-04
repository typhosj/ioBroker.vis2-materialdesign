# Checkbox

[User guide](../README.md) › [Widget catalog](README.md) · [Deutsch](../../de/widgets/checkbox.md)

A native VIS 2 Material Design checkbox that reads and writes boolean or custom
off/on values. Template id: `tplVis2-materialdesign-CheckBox`.

<img src="../../media/vis2_checkbox_runtime.png" alt="Material Design checkbox in VIS 2">

## Editor settings

The screenshot shows the two relevant groups (**General** and **Label**)
expanded. Settings not listed below are self-explanatory. The editor UI follows
the ioBroker system language, so the screenshots are German.

<img src="../../media/vis2_checkbox_editor_overview.png" width="340" alt="Checkbox editor options">

**General**

- **type of toggle** – `boolean` reads and writes `true`/`false`; `Value` reads
  and writes **value for off** / **value for on** instead. Under `boolean` only
  a strict `true` counts as on, everything else is off.
- **state if value unequal to 'on' condition** – only applies to the `Value`
  toggle: `on` treats every value that is not the off value as on, `off` accepts
  only the exact on value.
- **vibrate on mobile devices [ms]** – haptic feedback duration on press in
  milliseconds (mobile only), default 50; `0` turns the vibration off.
- **Play click sound** / **Click sound volume** – click tone when switching and
  its volume from 0 to 1 (default 0.5).
- **read only** – shows the state but never writes it.

**Label**

- **Label false / Label true** – text shown next to the box in the off / on state.
- **Label position** – left, right or off.
- **activate label click** – lets a click on the label toggle the value, not
  only the box. On by default.
- **Value font / value font size** – font of the label.

The **colors** group controls **checkbox color**, **border color**, **hover
color of checkbox**, **label color** and **active label color**.

**Locking** puts a lock over the widget: **enable Locking** switches it on, a
click on the icon unlocks, and **auto Locking after [s]** (default 10) locks
again. **gray filter if locked** (default 30 %) fades the locked widget; for its
**icon** you can select an icon or an image, and **symbol distance from top /
left [%]** places it.

<img src="../../media/vis2_checkbox_editor_lock.png" width="340" alt="Locking group icon field">

## Design style

The **Classic** (left) and **Material 3** (right) style side by side, see
[Design style](../README.md#design-style): checkbox and switch: off, on, label
on the left, read-only, locked, an explicit color and the Material 3 check mark
inside the switch handle.

<img src="../../media/vis2_toggles_styles.png" alt="Checkbox and switch in the Classic and the Material 3 style">

The same widgets with the dark theme switched on:

<img src="../../media/vis2_toggles_styles_dark.png" alt="Checkbox and switch in the Classic and the Material 3 style, dark theme">
