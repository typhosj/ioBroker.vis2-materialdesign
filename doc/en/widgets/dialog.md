# Dialog

[User guide](../README.md) › [Widget catalog](README.md) · [Deutsch](../../de/widgets/dialog.md)

Two VIS 2 dialogs opened by a state: one embeds a VIS 2 view, the other an
iFrame URL.

Template ids: `tplVis2-materialdesign-Vuetify-Dialog-View` and
`tplVis2-materialdesign-Vuetify-Dialog-iFrame`.

<p>
<img src="../../media/vis2_dialog_runtime.png" alt="Opened view dialog in VIS 2" width="300">
<img src="../../media/vis2_dialog_iframe_runtime.png" alt="Opened iFrame dialog in VIS 2" width="300">
</p>

Left: a dialog embedding a VIS 2 view (a room control panel). Right: a dialog embedding an iFrame page.

## Editor settings

<table>
<tr><td><img src="../../media/vis2_dialog_editor_overview.png" width="300"></td>
<td><ul><li>Choose a local button or a datapoint as the opening method. A boolean true opens the datapoint-controlled dialog; closing writes false.</li><li>View variant: choose the embedded VIS 2 view.</li><li>iFrame variant: set URL, sandbox and scrolling.</li><li>Dialog, title, action buttons and close behaviour have separate groups.</li></ul></td></tr>
</table>

Use **no sandbox** only for trusted iFrame content.

For permanently embedded content without a dialog, see
[Advanced View in Widget](html-widgets.md).
