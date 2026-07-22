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

- **Min / Max** – bildet den State-Wert auf 0–100 Prozent ab.
- **unbestimmt** – Dauerrotation, die den Wert ignoriert (Busy-Anzeige).

**Layout**

- **Größe** – Durchmesser des Rings.
- **Ringbreite** – Stärke des Fortschritts-Strichs.
- **Drehung** – Startwinkel des Rings.

**Beschriftung**

- **Beschriftungsstil** – Prozent, Rohwert oder eigene Vorlage.
- **Einheit** – an den Wert angehängter Text.
- **eigene Beschriftung** – freier Text/Binding, wenn der Stil *eigene* ist.

Unter **Farben** werden Fortschrittsfarbe, Hintergrundring, Innen-(Mitte-)Farbe
sowie zwei optionale Schwellenfarben gesetzt, die die Fortschrittsfarbe je nach
Bedingung ersetzen.
