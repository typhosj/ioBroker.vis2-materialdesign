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

**Common**

- **input method for the list data** – `via editor` (title, subtitle, text and
  image live in the fields) or `JSON string` (one state carries them).
- **JSON-String: object id** – the state for the `JSON string` method. Its value
  is an object with `title`, `subTitle`, `body` and `image`; if it is not valid
  JSON the card shows a red error message instead of the title.
- **layout** – `Basic` (image on top, title below), `BasicHeader` (title above
  the image), `BasicHeaderOverlay` (title inside the image) or `Horizontal`
  (image on the left).
- **style** – `default` or `outlined` (an outline instead of a shadow).
- **show scrollbar** – lets the text section scroll when it is taller than the card.

**title / text**

- **show heading / show subtitle / show text** – hide the three sections
  individually.
- **title / subtitle / HTML** – the contents. They accept HTML and bindings, see
  [Show values inside texts](../README.md#show-values-inside-texts). Use only
  trusted HTML.
- **title font size / text size** – the Material Design typography steps instead
  of fixed pixel values.
- **sub title height / text height** – a fixed height for that section.

**image**

- **Image** – image source (path, URL or data URL).
- **object id for refresh** – when this state changes, the image is reloaded.
  That only works for a URL or an absolute path, not for a data URL.
- **delay of refresh through object id** – wait in milliseconds before the
  reload, 180000 at most.
- **animation duration of refresh through object id** – length of the cross-fade.
- **refresh after wake-up / refresh on view change** – additional reload triggers.

The **card action** group makes the card clickable:

<img src="../../media/vis2_html_card_editor_2.png" width="340" alt="Card action options">

- **clickable area** – `none` switches the action off; every other setting
  (`card`, `Image`, `text`) makes the whole card clickable.
- **action on click** – `link` opens the **URL** in a new tab, `state` writes the
  **value to write** into the **Object ID for action**.

## Design style

The **Classic** (left) and **Material 3** (right) style side by side, see
[Design style](../README.md#design-style): the Basic, Basic outlined,
BasicHeader, BasicHeaderOverlay and Horizontal layouts and a clickable card.

<img src="../../media/vis2_html_card_styles.png" alt="HTML card in the Classic and the Material 3 style">

The same widgets with the dark theme switched on:

<img src="../../media/vis2_html_card_styles_dark.png" alt="HTML card in the Classic and the Material 3 style, dark theme">
