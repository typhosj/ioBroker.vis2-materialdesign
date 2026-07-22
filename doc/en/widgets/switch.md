# Switch

[User guide](../README.md) › [Widget catalog](README.md) · [Deutsch](../../de/widgets/switch.md)

A native VIS 2 Material Design switch that reads and writes boolean or custom
off/on values. Template id: `tplVis2-materialdesign-Switch`.

<img src="../../media/vis2_switch_runtime.png" alt="Material Design switch in VIS 2">

## Editor settings

The screenshot shows the relevant groups (**General** and **Label**) expanded.
Settings not listed below are self-explanatory. The editor UI follows the
ioBroker system language, so the screenshots are German.

<img src="../../media/vis2_switch_editor_overview.png" width="340" alt="Switch editor options">

**General**

- **type of toggle** – `boolean` writes `true`/`false`; `value` writes the custom **off value** / **on value** instead.
- **state if value unequal to on** – which state (on/off) is shown when the read value matches neither the off nor the on value.
- **vibrate on mobile devices [s]** – haptic feedback duration on press (mobile only).
- **click sound volume** – volume of the click sound when *play click sound* is enabled.
- **read only** – shows the state but never writes it.

**Label**

- **label False / label True** – text shown next to the switch in the off / on state.
- **label position** – left, right or off.
- **enable label click** – lets a click on the label toggle the value, not only the switch.

The optional **Colors** group controls thumb, track, active and hover colors.
**Locking** adds an unlock overlay and an automatic re-lock delay.
