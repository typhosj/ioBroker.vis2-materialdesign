# Runder Slider

[Anwenderhandbuch](../README.md) › [Widget-Katalog](README.md) · [English](../../en/widgets/slider-round.md)

Kreisförmiger nativer VIS-2-Slider für numerische Zustände. Template-ID:
`tplVis2-materialdesign-Slider-Round`.

<img src="../../media/vis2_slider_round_runtime.png" alt="Runder Material-Design-Slider in VIS 2">

## Editor-Einstellungen

Der Screenshot zeigt die Gruppen **Allgemein** und **Beschriftung** aufgeklappt.
Nicht aufgeführte Einstellungen sind selbsterklärend.

<img src="../../media/vis2_slider_round_editor_overview.png" width="340" alt="Runder Slider Allgemein und Beschriftung">

**Allgemein**

- **Objekt-ID** – Wert-State; **Objekt-ID in Arbeit** sperrt den Slider, solange
  dieser State meldet, dass das Gerät noch anfährt.
- **Minimum / Maximum / Schritte** – Wertebereich und Schrittweite (Vorgabe 1).
- **Wert erst beim Loslassen senden** – schreibt einmal am Ende der Bewegung
  statt fortlaufend beim Ziehen; der Knopf folgt so oder so dem Finger.
- **Startwinkel / Bogenlänge** – wo die kreisförmige Spur beginnt (Vorgabe 135°)
  und über wie viele Grad sie läuft (Vorgabe 270°).
- **Schieberegler Dicke** (Vorgabe 3) und **Knopfgröße** (Vorgabe 6) zählen in
  Prozent der Widget-Kantenlänge, nicht in Pixeln — die Zeichnung liegt in einem
  100×100-Raster.
- **Faktor für die Knopfgröße** – multipliziert die Knopfgröße dauerhaft,
  Vorgabe 1,5.
- **Schieberegler Bewegung von rechts nach links** – kehrt die Richtung um.
- **Nur lesen** – zeigt den Wert an, nimmt aber keine Eingabe an.

**Beschriftung**

- **Wert anzeigen** – Wertlabel in der Mitte, Vorgabe an; **vertikale
  Textposition des Wertes** verschiebt es nach oben oder unten.
- **Wertbeschriftungsstil / Einheit** – **Wert** hängt die Einheit an den
  Rohwert, **Prozent** zeigt stattdessen den abgerundeten Prozentwert; die
  Einheit entfällt dabei.
- **Text für Wert kleiner oder gleich Minimum** greift ab dem Minimum,
  **Text für Wert kleiner oder gleich Maximum** trotz seiner Beschriftung ab dem
  **Maximum**.
- **'kleiner als' Bedingung für den Text des Wertes** / **Text für 'kleiner
  als'** – der Text erscheint zwischen Minimum (ausschließlich) und dieser
  Grenze (einschließlich); **'größer als' Bedingung für den Text des Werts** /
  **Text für 'größer als'** entsprechend ab dieser Grenze bis unter das Maximum.

Die Gruppe **Farben** (**Hintergrund**, **Farbe vor dem Regler**, **Farbe des
Reglers**, **Farbe nach Regler**, **Textfarbe des Wertes**) erscheint erst, wenn
in **Allgemein** der Schalter **Erweiterte Optionen anzeigen** gesetzt ist.

## Gestaltungsstil

Die Stile **Klassisch** (links) und **Material 3** (rechts) nebeneinander, siehe
[Gestaltungsstil](../README.md#gestaltungsstil): den horizontalen Slider mit
Wertlabel, Skala und Thumb-Label, read only, vertikal sowie den runden Slider
mit 360° und 270° und read only.

<img src="../../media/vis2_slider_styles.png" alt="Slider und runder Slider im klassischen und im Material-3-Stil">

Dieselben Widgets bei eingeschaltetem Dark-Theme:

<img src="../../media/vis2_slider_styles_dark.png" alt="Slider und runder Slider im klassischen und im Material-3-Stil, dunkel">
