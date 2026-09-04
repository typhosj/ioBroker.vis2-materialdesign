# Material-Design-Icons und Hilfswidgets

[Anwenderhandbuch](../README.md) › [Widget-Katalog](README.md) · [English](../../en/widgets/material-design-icons-and-images.md)

Native VIS-2-Hilfswidgets für ein einzelnes Icon, eine Farbschema-Vorschau und
die installierte Paketversion.

Template-IDs: `tplVis2-materialdesign-Icon`,
`tplVis2-materialdesign-ColorScheme-Preview` und
`tplVis2-materialdesign-Installed-Version`.

<img src="../../media/vis2_material_design_icons_and_images_runtime.png" alt="Material-Design-Icons in VIS 2">

## Editor-Einstellungen

Der Screenshot zeigt das **Icon**-Widget mit aufgeklappter Gruppe
**Allgemein**. Nicht aufgeführte Einstellungen sind selbsterklärend.

<img src="../../media/vis2_material_design_icons_and_images_editor_overview.png" width="340" alt="Icon-Editoroptionen">

**Allgemein (Icon-Widget)**

- **Symbol** – ein Material-Design-Icon-Name (z. B. `lightbulb`), ein Bildpfad/URL oder eine Data-URL.
- **Symbolgröße** – Kantenlänge in Pixeln, Vorgabe 50.
- **Symbolfarbe** – färbt einfarbige SVG/Icons per CSS-Maske um; mehrfarbige Bilder bleiben unverändert.

Das sind alle Felder: das Icon-Widget liest keinen State und hat keine
Objekt-ID. Soll ein Icon auf einen Wert reagieren, ist das [Wert-Widget](value.md)
oder ein [Button](buttons.md) das richtige.

Das Widget **Farbschema-Vorschau** zeigt die verfügbaren Material-Design-Paletten,
**Installierte Version** die paketierte Widget-Version. Beide haben außer
**Gestaltungsstil** und den Theme-Feldern keine Einstellungen.

Icon-/Bildfelder akzeptieren Material-Design-Namen, gängige Bildpfade, HTTP(S)-
URLs und Data-URLs. SVG-Masken unterstützen eine einzelne konfigurierte Farbe.

## Zwei Icon-Quellen

Jedes Icon-/Bildfeld öffnet denselben Picker, und dieser Picker hat zwei Quellen.
Umgeschaltet wird mit den Schaltflächen **MDI** / **Symbols** über dem Icon-Raster.

- **MDI** (Standard) – [Material Design Icons](https://pictogrammers.com/library/mdi/),
  7447 Glyphen. Das ist der Satz des ursprünglichen Adapters, bestehende Projekte
  funktionieren also unverändert weiter. Der Name darf mit oder ohne Präfix
  geschrieben werden: `lightbulb` und `mdi-lightbulb` sind dasselbe Icon.
- **Symbols** – [Material Symbols Outlined](https://fonts.google.com/icons), Googles
  aktueller Icon-Satz und derjenige, gegen den Material 3 gezeichnet ist. Ein
  Symbols-Name wird immer **mit dem Präfix `ms-`** gespeichert: `ms-light_mode`,
  `ms-schedule`. Das Präfix unterscheidet die beiden Sätze — mehrere Namen gibt es
  in beiden, und ohne Präfix würde `light_mode` als MDI-Icon gesucht und nicht
  dargestellt.

Beide Sätze werden selbst ausgeliefert, brauchen zur Laufzeit also kein Internet.
Es sind getrennte Webfonts, und ein Panel lädt einen davon erst, wenn tatsächlich
eine Glyphe daraus gezeichnet wird: eine Ansicht nur mit MDI-Icons lädt den
Symbols-Font nie und umgekehrt. Werden beide in einer Ansicht gemischt, fallen
beide Downloads an.

Statt durch das Raster zu scrollen, kann der Name auch direkt in das Textfeld des
Pickers eingegeben werden — es akzeptiert `mdi-name`, `ms-name` und Bildpfade
gleichermaßen.
