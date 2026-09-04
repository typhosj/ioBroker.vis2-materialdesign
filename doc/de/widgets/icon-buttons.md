# Icon-Buttons

[Anwenderhandbuch](../README.md) › [Widget-Katalog](README.md) · [English](../../en/widgets/icon-buttons.md)

Kompakte VIS-2-Buttons ohne Beschriftung für Navigation, Links, State,
Multi-State, Addition, Toggle und einen kreisförmigen Wert-Slider.

Template-IDs beginnen mit `tplVis2-materialdesign-Icon-Button-`, gefolgt von
`Navigation`, `Link`, `State`, `State-Multi`, `Adition`, `Toggle` oder `Slider`.

<img src="../../media/vis2_icon_buttons_runtime.png" alt="Material-Design-Icon-Buttons in VIS 2">

## Editor-Einstellungen

Die Screenshots zeigen einen normalen Icon-Button und die kreisförmige Variante
*Slider*. Nicht aufgeführte Einstellungen sind selbsterklärend.

<img src="../../media/vis2_icon_buttons_editor_overview.png" width="340" alt="Icon-Button Allgemein und Icon">

**Allgemein** – die Aktionsfelder entsprechen der jeweiligen
[Button](buttons.md)-Variante (Zielansicht, URL, Objekt-ID und Wert, …).

Der Icon-Button hat keine Gruppe **Beschriftung** — ihm fehlt der Text.

**Symbol**

- **Bild** / **aktives Bild** – Material-Design-Iconname oder Bildquelle, das
  zweite für den Ein-Zustand.
- **Bildfarbe / aktive Bildfarbe** – einfarbiges Icon umfärben; eine eigene
  Farbe kann den Ein-Zustand markieren.
- **Bildhöhe** – Größe des Icons im runden Button.

Die Variante **Slider** macht aus dem Button einen kreisförmigen Wert-Slider:

<img src="../../media/vis2_icon_buttons_editor_2.png" width="340" alt="Icon-Button Slider-Variante">

- **Nur Slider** – Wertsteuerung ohne Klickaktion.
- **Wert erst beim Loslassen senden** – schreibt den Wert nur einmal am Ende der
  Bewegung statt fortlaufend beim Ziehen.
- **Wert für aus / Wert für ein** – auf den Bogen abgebildeter Wertebereich,
  Vorgabe 0 bis 100.
- **Winkelversatz / Bogenwinkel** – wo der Bogen beginnt (0 heißt oben) und wie
  viel Grad er umfasst, Vorgabe 360.
- **Schieberegler Durchmesser** – Durchmesser des Bogens, 48 bis 160 px; die
  Strichstärke setzt **Slider-Dicke** (Vorgabe 4 px).
- **Vordergrundfarbe / Hintergrundfarbe** – Bogen und Bogenspur.
- **Vorne anzeigen** legt den Bogen über das Icon statt darunter, **Immer
  anzeigen** hält ihn sichtbar; ohne den Schalter erscheint er nur bei Hover
  oder Berührung.
- **Einfärben** / **Einfärbungsfaktor** – dimmt das Icon mit sinkendem Wert; der
  Faktor (Vorgabe 0,5) bestimmt, wie stark.

Unterstützt werden Material-Design-Iconnamen, lokale Bilder, URLs und Data-URLs.

## Gestaltungsstil

Die Stile **Klassisch** (links) und **Material 3** (rechts) nebeneinander, siehe
[Gestaltungsstil](../README.md#gestaltungsstil): die Varianten standard, filled,
tonal und outlined, read only und ein 56-px-Ziel.

<img src="../../media/vis2_icon_buttons_styles.png" alt="Icon-Buttons im klassischen und im Material-3-Stil">

Dieselben Widgets bei eingeschaltetem Dark-Theme:

<img src="../../media/vis2_icon_buttons_styles_dark.png" alt="Icon-Buttons im klassischen und im Material-3-Stil, dunkel">
