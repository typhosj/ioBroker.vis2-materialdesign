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

- **oid** – the value state; **oid-working** optionally reports that a device is still moving to the target.
- **orientation / reverse** – horizontal or vertical, and inverted direction.
- **min / max / step** – value range and increment.
- **read only** – shows the value but never writes it.
- **send value on release** – nothing is written while the thumb is dragged, only once when the pointer comes up.

**Scale (ticks)**

- **show ticks** – draws tick marks along the track.
- **tick labels** – shows the value at each tick; tick size and colors follow.

<img src="../../media/vis2_slider_editor_2.png" width="340" alt="Slider label and thumb label options">

**Label**

- **prepend text** – caption shown left of the slider.
- **value label style / unit** – raw value or percent, plus a unit suffix.
- **min / max texts** and **less-than / greater-than replacement texts** – show fixed text at the ends or below/above a limit instead of the number.

**Thumb label**

- **show thumb label** – off, while dragging or always.
- Thumb **size**, background and font colors follow.

## Writing while dragging

A drag would otherwise write a state on every pointer move — hundreds of writes
the bus and the device behind it cannot keep up with, which leaves a Zigbee lamp
seconds behind the finger. The widget therefore sends the first move at once, so
a tap still reacts, limits the rest to one write per 200 ms, and flushes on
release: the value the finger stopped on is always the value that lands.

**send value on release** goes further and writes nothing at all during the drag.
The thumb follows the finger in both modes; only the writing differs. Use it for
devices that should not see intermediate values. Slider, Slider Round and the
Icon Button Slider behave the same way here.

