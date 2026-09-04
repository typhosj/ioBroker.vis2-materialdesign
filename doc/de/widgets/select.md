# Select und Autocomplete

[Anwenderhandbuch](../README.md) › [Widget-Katalog](README.md) · [English](../../en/widgets/select.md)

Native VIS-2-Dropdowns zur Wertauswahl. Autocomplete verhält sich wie Select,
filtert die Einträge aber zusätzlich beim Tippen.

Template-IDs: `tplVis2-materialdesign-Select` und `tplVis2-materialdesign-Autocomplete`.

<img src="../../media/vis2_select_runtime.png" alt="Material-Design-Auswahlelemente in VIS 2">

Autocomplete nutzt dieselben Einstellungen, filtert die Liste aber beim Tippen —
praktisch bei langen Wertelisten wie Städten oder Titeln.

<img src="../../media/vis2_autocomplete_runtime.png" alt="Material-Design-Autocomplete in VIS 2">

## Editor-Einstellungen

Der Screenshot zeigt die Menü-Gruppen aufgeklappt. Nicht aufgeführte
Einstellungen sind selbsterklärend.

<img src="../../media/vis2_select_editor_overview.png" width="340" alt="Select Menüdaten, Layout und Eintragsoptionen">

**Allgemein**

- **Objekt-ID** – der State, in den die Auswahl geschrieben wird und aus dem der
  angezeigte Wert kommt.
- Nur Autocomplete: **Eingabemodus** – `schreiben` schreibt getippten Text, der
  zu keinem Eintrag passt, unverändert in den State; `auswählen` verwirft ihn.
- Nur Autocomplete: **Eingabetyp** – `Text`, `Datum` oder `Zeit` für das
  Eingabefeld.

**Daten des Menüs**

- **Eingabemethode für die Menüdaten** – `über den Editor` (indizierte Gruppen
  **Menüpunkt [n]**), `JSON-String`, `Objekt hat Werteliste` (die `states` des
  Objekts aus der Objekt-ID) oder `Werteliste`.
- **Editor: Anzahl der Menüpunkte** – wie viele indizierte Gruppen **Menüpunkt [n]**
  es gibt.
- **Werteliste / Werteliste: Beschriftung / Werteliste: Bilder** – drei
  semikolongetrennte Listen, die zeilenweise zusammengehören, z. B. Werte
  `1;2;3`, Beschriftungen `Wohnzimmer;Küche;Bad`, Bilder
  `sofa;silverware-fork-knife;shower`. Ohne Beschriftung steht der Wert selbst da.
- **JSON-String** – ein Array von Objekten mit `value`, `text`, `subText`,
  `icon`, `iconColor` und `iconColorSelectedTextField`. Ein Eintrag ohne `value`
  wird übersprungen, ohne `text` steht der Wert da.

**Menü-Layout**

- **Position / Positionsoffset verwenden** – ob das Menü `auto`, `top` oder
  `bottom` öffnet.
- **Menü auch über Schaltfläche Löschen öffnen** – nach dem Löschen des Werts
  öffnet sich die Liste erneut.
- **Symbol des ausgewählten Elements anzeigen** – wo im Eingabefeld das Symbol
  des gewählten Eintrags erscheint: `nicht anzeigen`, `prepend`, `prepend-inner`
  oder `append-outer`. Es ersetzt dort das fest eingestellte Symbol.
- **Wert anzeigen** – zeigt in jeder Menüzeile zusätzlich den Wert rechts neben
  dem Text.
- Zeilenhöhe, Schriften und Farben der Liste gelten je für den normalen,
  überfahrenen und ausgewählten Zustand.

**Menüpunkt [n]**

Die Gruppen erscheinen nur bei der Methode `über den Editor`.

- **Wert** – was in den State geschrieben wird. Bleibt er leer, wird die
  **Beschriftung** geschrieben.
- **Beschriftung / zweiter Text** – die beiden Textzeilen des Eintrags.
- **Symbol / Symbolfarbe** – Symbol der Menüzeile.
- **Symbolfarbe ausgewählt für das Textfeld** – Farbe desselben Symbols, wenn es
  als gewählter Eintrag im Eingabefeld steht.

Die Gruppe **Layout Eingabe** (`regular`, `solo`, `solo-rounded`, `solo-shaped`,
`filled`, `filled-rounded`, `filled-shaped`, `outlined`, `outlined-rounded`,
`outlined-shaped`) entspricht dem [Eingabe](input.md)-Widget, ebenso
**Beschriftung der Eingabe**, **Anhänge der Eingabe**, **Untertext der Eingabe**
und **Zählerlayout**.

**Symbole**

Für das **Text-Löschen-Symbol**, das **Menüsymbol** (Aufklapp-Pfeil), das
**vorangestellte**, das **innere vorangestellte** und das **äußere angehängte
Symbol** lässt sich je ein Icon oder ein Bild samt Größe und Farbe wählen.

<img src="../../media/vis2_select_editor_icons.png" width="340" alt="Select-Symbolfelder">

## Gestaltungsstil

Die Stile **Klassisch** (links) und **Material 3** (rechts) nebeneinander, siehe
[Gestaltungsstil](../README.md#gestaltungsstil): die Layouts regular, filled und
outlined, Einträge mit Symbolen, Wert-Spalte, Clear-Icon sowie Autocomplete
während der Eingabe und nach der Auswahl.

<img src="../../media/vis2_select_styles.png" alt="Select und Autocomplete im klassischen und im Material-3-Stil">

Dieselben Widgets bei eingeschaltetem Dark-Theme:

<img src="../../media/vis2_select_styles_dark.png" alt="Select und Autocomplete im klassischen und im Material-3-Stil, dunkel">
