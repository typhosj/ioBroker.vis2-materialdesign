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

The screenshots show the view dialog's **General** group and the iFrame group.
Settings not listed below are self-explanatory. The editor UI follows the
ioBroker system language, so the screenshots are German.

<img src="../../media/vis2_dialog_editor_overview.png" width="340" alt="View dialog general options">

**General**

- **opening method** – a local button or a datapoint. With a datapoint, a boolean `true` opens the dialog and closing writes `false`.
- **open datapoint** – the state that controls the datapoint method.
- **fullscreen below resolution** – show the dialog fullscreen under this screen width.
- **embedded view** (`contains_view`) – the VIS 2 view shown inside the dialog (view variant).

The **iFrame** variant replaces the embedded view with a web page:

<img src="../../media/vis2_dialog_editor_2.png" width="340" alt="iFrame dialog settings">

- **URL** – page shown in the iFrame.
- **no sandbox** – disables the iFrame sandbox; use only for trusted content.
- **scroll X / Y / seamless** – scrolling and seamless embedding options.

The trigger button text/style, dialog size, header, footer and action buttons
have their own layout groups.

For permanently embedded content without a dialog, see
[Advanced View in Widget](html-widgets.md).
