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

The screenshots show the view dialog's **Common** group and the iFrame group.
Settings not listed below are self-explanatory. The editor UI follows the
ioBroker system language, so the screenshots are German.

<img src="../../media/vis2_dialog_editor_overview.png" width="340" alt="View dialog general options">

**Common**

- **method to show dialog** – `button` (the widget's own button opens it) or
  `datapoint`.
- **boolean switch to show dialog** – the state for the `datapoint` method:
  `true` opens the dialog, closing writes `false` back.
- **show fullscreen dialog if resolution is lower than** – below this window
  width in pixels the dialog fills the screen.
- **view** – the VIS 2 view shown inside the dialog (view variant only).

The **iFrame** variant replaces the embedded view with a web page:

<img src="../../media/vis2_dialog_editor_2.png" width="340" alt="iFrame dialog settings">

**iFrame settings**

- **source** – the URL shown in the iFrame.
- **disable sandbox** – lifts the iFrame sandbox; only for trusted content that
  does not run otherwise.
- **horizontal scrolling / vertical scrolling / seamless** – scrollbars and
  seamless embedding.

**Dialog Layout**

- **max width / height / distance to border** – the size of the dialog; the width
  may also be a CSS value such as `96vw`.
- **closing on click outside** – switched off, only the close button remains.
- **overlay color of background / transparency** – the dimmed area behind the
  dialog.
- **height of header / height of footer / show divider / z-Index** – the frame
  around the content.

**Button Layout** styles the trigger button (**Button text**, **button style**,
icon, colors), **title layout** the **title** — without one, the view's name is
shown — and **layout of dialog footer buttons** the close button (**text of close
button**, position, size, full width).

For permanently embedded content without a dialog, see
[Advanced View in Widget](html-widgets.md).
