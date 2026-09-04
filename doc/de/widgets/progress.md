# Fortschritt

[Anwenderhandbuch](../README.md) › [Widget-Katalog](README.md) · [English](../../en/widgets/progress.md)

Linearer VIS-2-Fortschrittsbalken für numerische oder boolesche Zustände.
Template-ID: `tplVis2-materialdesign-Progress`.

<img src="../../media/vis2_progress_runtime.png" alt="Linearer Material-Design-Fortschritt in VIS 2">

## Editor-Einstellungen

Der Screenshot zeigt die Gruppen **Allgemein**, **Layout** und **Beschriftung**
aufgeklappt. Nicht aufgeführte Einstellungen sind selbsterklärend.

<img src="../../media/vis2_progress_editor_overview.png" width="340" alt="Fortschritt Allgemein, Layout und Beschriftung">

**Allgemein**

- **Minimum / Maximum** – bilden den State-Wert auf 0–100 Prozent ab. Ein
  boolescher State zählt `true` als Maximum und `false` als Minimum, Werte
  außerhalb werden auf die Grenzen gekappt.
- **Umkehren** – füllt von der gegenüberliegenden Seite.
- **Wert invertieren** – füllt den Balken auf den verbleibenden Prozentwert; die
  Beschriftung zeigt weiter den erreichten.

**Layout**

- **abgerundete Ecken** – rundet die Balkenenden.
- **unbestimmt - kontinuierlich animiert** – Daueranimation, die den Wert
  ignoriert (Busy-Anzeige).
- **90 Grad drehen** – `Ja` stellt den Balken senkrecht.

**Beschriftung**

- **Wert anzeigen** – blendet die Beschriftung im Balken aus.
- **Wertbeschriftungsstil** – `Prozent`, `Wert` (der State-Wert mit **Einheit**)
  oder `Benutzerdefiniert`.
- **benutzerdefiniertes Beschriftung** – freier Text für den Stil
  `Benutzerdefiniert`. `[#value]` setzt den State-Wert ein, `[#percent]` den
  Prozentwert, also z. B. `[#value] von 500 W ([#percent] %)`.
- **Kommastellen** – Nachkommastellen beider Zahlen.
- **Textausrichtung** – `Anfang`, `Mitte` oder `Ende`.

**Farben**

- **Farbe Fortschritt / Hintergrundfarbe** – Balken und Spur.
- **Bedingung für Farbe 1 Fortschritt [>] / Farbe 1 Fortschritt** und dasselbe
  Paar für Farbe 2 – die Bedingung ist ein **Prozentwert**, nicht der State-Wert:
  über der ersten Bedingung gilt Farbe 1, über der zweiten Farbe 2.

Die Gruppe **Streifen** aktiviert und gestaltet ein Streifenmuster
(**gestreift**, **Streifenwinkel**, drei Streifenbreiten und
**Streifenabstand**).

## Gestaltungsstil

Die Stile **Klassisch** (links) und **Material 3** (rechts) nebeneinander, siehe
[Gestaltungsstil](../README.md#gestaltungsstil): den linearen Balken bei
niedrigem, mittlerem und hohem Wert, eckig und gestreift, unbestimmt sowie die
kreisförmige Variante bestimmt, dick und unbestimmt.

<img src="../../media/vis2_progress_styles.png" alt="Fortschritt im klassischen und im Material-3-Stil">

Dieselben Widgets bei eingeschaltetem Dark-Theme:

<img src="../../media/vis2_progress_styles_dark.png" alt="Fortschritt im klassischen und im Material-3-Stil, dunkel">
