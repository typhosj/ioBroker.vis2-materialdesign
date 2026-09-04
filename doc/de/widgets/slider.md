# Slider

[Anwenderhandbuch](../README.md) › [Widget-Katalog](README.md) · [English](../../en/widgets/slider.md)

Horizontaler oder vertikaler nativer VIS-2-Slider für numerische Zustände.
Template-ID: `tplVis2-materialdesign-Slider`.

<img src="../../media/vis2_slider_runtime.png" alt="Material-Design-Slider in VIS 2">

## Editor-Einstellungen

Die Screenshots zeigen die Gruppen, die Verhalten und Beschriftung bestimmen.
Nicht aufgeführte Einstellungen sind selbsterklärend.

<img src="../../media/vis2_slider_editor_overview.png" width="340" alt="Slider Allgemein und Skala">

**Allgemein**

- **oid** – der Wert-State; **Objekt-ID in Arbeit** meldet optional, dass ein Gerät die Zielposition noch anfährt.
- **Ausrichtung** (`horizontal`, `vertikal`) und **Schieberegler umkehren** – invertierte Richtung.
- **Min / Max / Schritt** – Wertebereich und Schrittweite, Vorgaben 0, 100 und 1. Sind Min und Max gleich, rechnet das Widget mit Min + 100.
- **Nur lesen** – zeigt den Wert an, schreibt aber nie.
- **Wert erst beim Loslassen senden** – schreibt nicht während des Ziehens, sondern einmal am Ende.
- **Knopfgröße** – `normal`, `Wurschtfinger` oder `große Wurschtfinger`, für die Bedienung am Touchscreen.

**Schritte Layout (Teilstriche)**

- **Schritte anzeigen** – `nicht anzeigen`, `anzeigen bei Bedienung` oder `immer anzeigen`.
- **Text der Schritte (durch Kommas getrennt)** – die Beschriftungen der Teilstriche, z. B. `aus, halb, voll`. Die Anzahl der Texte bestimmt zugleich, wie viele Teilstriche gezeichnet werden; ohne Texte ergibt sie sich aus Min, Max und Schritt.

<img src="../../media/vis2_slider_editor_2.png" width="340" alt="Slider Beschriftung und Regler-Label">

**Beschriftung**

- **Text vorangestellt** – Beschriftung links vom Slider, mit eigener Breite, Farbe und Schrift.
- **Wert anzeigen** (Vorgabe an), **Wertbeschriftungsstil** (`Wert` oder `Prozent`) und **Einheit** – die Zahl neben dem Slider. **Abstand Beschriftung** ist ihre Breite in Pixel (Vorgabe 50).
- **Text für Wert kleiner oder gleich Minimum / Maximum** – fester Text an den beiden Enden statt der Zahl. Das zweite Feld greift am Maximum; die Beschriftung im Editor ist irreführend.
- **'kleiner als' Bedingung für den Text des Wertes** / **Text für 'kleiner als'** und das Gegenstück für „größer als“ – ersetzen die Zahl unterhalb bzw. oberhalb einer Grenze, z. B. „aus“ unter 1.

**Layout des Regler-Label**

- **Label anzeigen** – `nicht anzeigen`, `anzeigen bei Bedienung` oder `immer anzeigen`.
- **benutze Regeln der Beschriftung** – das Regler-Label übernimmt dieselben Ersatztexte wie die Wertbeschriftung; ohne den Schalter zeigt es immer die nackte Zahl.
- Größe, Hintergrund- und Schriftfarben des Reglers folgen.

## Gestaltungsstil

Die Stile **Klassisch** (links) und **Material 3** (rechts) nebeneinander, siehe
[Gestaltungsstil](../README.md#gestaltungsstil): den horizontalen Slider mit
Wertlabel, Skala und Thumb-Label, read only, vertikal sowie den runden Slider
mit 360° und 270° und read only.

<img src="../../media/vis2_slider_styles.png" alt="Slider und runder Slider im klassischen und im Material-3-Stil">

Dieselben Widgets bei eingeschaltetem Dark-Theme:

<img src="../../media/vis2_slider_styles_dark.png" alt="Slider und runder Slider im klassischen und im Material-3-Stil, dunkel">
