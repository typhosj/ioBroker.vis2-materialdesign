# Checkbox

[Back to README](../../../README.md#widget-documentation)

A Material Design checkbox that reads and writes a state — boolean or custom
on/off values, with an optional label, theming, colors and a lock overlay.

Widget template id: `tplVis2-materialdesign-Checkbox`.

<img src="../../media/vis2_checkbox_runtime.png" alt="Checkbox at runtime">

## Editor settings

Select the widget in the VIS 2 editor and open the **WIDGET** tab. Settings that
are not listed below are self-explanatory. (The editor UI language follows your
ioBroker system language; the screenshot is from a German system.)

<table>
<tr><td rowspan="3"><img src="../../media/vis2_checkbox_editor_overview.png" width="260"></td>
<td><b>type of toggle</b></td><td><code>boolean</code> writes true/false; <code>value</code> writes the custom <i>value for off</i> / <i>value for on</i>.</td></tr>
<tr><td><b>state if value unequal to 'on'</b></td><td>Which state the checkbox shows when the current value matches neither the off nor the on value.</td></tr>
<tr><td><b>labelPosition</b></td><td>Place the label <code>left</code>, <code>right</code> or <code>off</code>; <i>activate label click</i> lets the label toggle the state too.</td></tr>
</table>

* **Colors** and **Locking** are optional groups — enable them with the checkbox
  next to the group title. Colors overrides the theme (box, border, hover, label);
  Locking adds a lock overlay that must be unlocked before the box changes and
  re-locks after a delay.
* **Theme** takes colors and fonts from the central Material Design theme; leave
  the Colors group disabled to use it.
