# Fortschritt kreisförmig

[Anwenderhandbuch](../README.md) › [Widget-Katalog](README.md) · [English](../../en/widgets/progress-circular.md)

Kreisförmiger VIS-2-Fortschritt mit derselben Wertabbildung und Beschriftung wie
der lineare Balken. Template-ID: `tplVis2-materialdesign-Progress-Circular`.

<img src="../../media/vis2_progress_circular_runtime.png" alt="Kreisförmiger Material-Design-Fortschritt in VIS 2">

## Editor-Einstellungen

Der Screenshot zeigt die Gruppen **Allgemein**, **Layout** und **Beschriftung**
aufgeklappt. Nicht aufgeführte Einstellungen sind selbsterklärend.

<img src="../../media/vis2_progress_circular_editor_overview.png" width="340" alt="Kreisförmiger Fortschritt Allgemein, Layout und Beschriftung">

**Allgemein**

- **Minimum / Maximum** – bilden den State-Wert auf 0–100 Prozent ab. Ein
  boolescher State zählt `true` als Maximum und `false` als Minimum.
- **unbestimmt - kontinuierlich animiert** – Dauerrotation, die den Wert ignoriert
  (Busy-Anzeige).

**Layout**

- **Größe** – Durchmesser des Rings. Leer gelassen füllt er das Widget.
- **Dicke** – Stärke des Rings.
- **Startpunkt drehen** – Startwinkel in Grad, Standard ist oben.

**Beschriftung**

- **Wert anzeigen** – blendet die Beschriftung in der Mitte aus.
- **Wertbeschriftungsstil** – `Prozent`, `Wert` (der State-Wert mit **Einheit**)
  oder `Benutzerdefiniert`.
- **benutzerdefiniertes Beschriftung** – freier Text für den Stil
  `Benutzerdefiniert`. `[#value]` setzt den State-Wert ein, `[#percent]` den
  Prozentwert.
- **Kommastellen** – Nachkommastellen beider Zahlen.

**Farben**

- **Farbe Fortschritt / Hintergrundfarbe** – Ring und Spur.
- **Kreis Hintergrundfarbe** – füllt die Fläche innerhalb des Rings.
- **Bedingung für Farbe 1 Fortschritt [>] / Farbe 1 Fortschritt** und dasselbe
  Paar für Farbe 2 – die Bedingung ist ein **Prozentwert**, nicht der State-Wert.

## Gestaltungsstil

Die Stile **Klassisch** (links) und **Material 3** (rechts) nebeneinander, siehe
[Gestaltungsstil](../README.md#gestaltungsstil): den linearen Balken bei
niedrigem, mittlerem und hohem Wert, eckig und gestreift, unbestimmt sowie die
kreisförmige Variante bestimmt, dick und unbestimmt.

<img src="../../media/vis2_progress_styles.png" alt="Fortschritt im klassischen und im Material-3-Stil">

Dieselben Widgets bei eingeschaltetem Dark-Theme:

<img src="../../media/vis2_progress_styles_dark.png" alt="Fortschritt im klassischen und im Material-3-Stil, dunkel">
