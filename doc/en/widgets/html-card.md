# HTML Card

[User guide](../README.md) › [Widget catalog](README.md) · [Deutsch](../../de/widgets/html-card.md)

A native VIS 2 Material Design card with title, subtitle, body, image and an
optional link or state-write action. Template id: `tplVis2-materialdesign-Card`.

<img src="../../media/vis2_html_card_runtime.png" alt="Material Design card in VIS 2">

## Editor settings

The screenshots show the layout/image groups and the card-action group. Settings
not listed below are self-explanatory. The editor UI follows the ioBroker system
language, so the screenshots are German.

<img src="../../media/vis2_html_card_editor_overview.png" width="340" alt="Card layout and image options">

**General**

- **card layout** – Basic, Basic Header, Header Overlay or Horizontal.
- **card style** – default or outlined.

**Image**

- **image** – image source (path, URL or data URL).
- **refresh object / delay** – reload the image when a state changes, after a delay.
- **refresh on wake-up / view change** – additional reload triggers.

The **Card action** group makes the card clickable:

<img src="../../media/vis2_html_card_editor_2.png" width="340" alt="Card action options">

- **click type** – which region reacts (whole card, image or text).
- **control type** – open a URL or write a state.
- **href / state object + value** – the target used by the chosen control type.

Content fields (title, subtitle, text) accept VIS 2 HTML/bindings. Use only
trusted HTML.
