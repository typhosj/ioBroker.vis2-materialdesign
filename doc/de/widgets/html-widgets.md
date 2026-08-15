# Advanced View in Widget

[Anwenderhandbuch](../README.md) › [Widget-Katalog](README.md) · [English](../../en/widgets/html-widgets.md)

Ein Child-View-Container, der komplette VIS-2-Ansichten einbettet und per State
auswählt.

Template-IDs: `tplVis2-materialdesign-view-in-widget` und
`tplVis2-materialdesign-view-in-widget8`.

<img src="../../media/vis2_html_widgets_runtime.png" alt="Eingebettete VIS-2-Ansicht">

## Editor-Einstellungen

Der Screenshot zeigt die Gruppe **Allgemein**. Nicht aufgeführte Einstellungen
sind selbsterklärend.

<img src="../../media/vis2_html_widgets_editor_overview.png" width="340" alt="Advanced View in Widget Allgemein">

**Allgemein**

- **Objekt-ID** – der State, dessen Wert die eingebettete Ansicht auswählt. Bei
  `view-in-widget` ist der Wert der **Name** der Ansicht (String, exakt wie im
  Editor); bei `view-in-widget8` ist es der **Index** `0 … n` der unten
  konfigurierten Ansichten (Zahl, `true`/`false` zählen als `1`/`0`).
- **Ansichten** – die anzeigbaren VIS-2-Ansichten.
- **Einblenden / Ausblenden** – Übergang beim Wechsel zwischen Ansichten.
- **Vorrendern** – Ansichten optional geladen halten, damit der Wechsel sofort
  erfolgt. Die Eingabefelder erscheinen erst, wenn **beim Laden gerenderte
  Ansichten** auf mindestens `0` gesetzt ist, und wirken zusammen mit **alle
  Ansichten rendern**.

Die `8`-Variante ergänzt indizierte State-Wert-zu-View-Einträge:

- **geladen halten** – alle konfigurierten Ansichten bleiben gemountet, der
  Wechsel erfolgt dadurch sofort. Ohne die Option wird nur die gewählte Ansicht
  gerendert.
- **nicht wenn unsichtbar** – ist das Widget ausgeblendet, werden die Ansichten
  abgeräumt statt im Hintergrund weiterzulaufen.

**Fehlersuche:** ist **Debug** aktiv, protokolliert das Widget bei jedem
Ansichtswechsel State-Wert und getroffene Ansicht in der Browser-Konsole.

Sollen mehrere Child Views gleichzeitig angeordnet werden, stattdessen
[Responsives Layout](responsive-layout.md) verwenden.

Der State, der die Ansicht auswählt, kommt typischerweise aus einem Menü: die
[Top App Bar](top-app-bar.md) schreibt den Index des gewählten Menüeintrags,
die `8`-Variante zeigt die Ansicht dazu.
