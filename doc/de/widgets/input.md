# Eingabe

[Anwenderhandbuch](../README.md) › [Widget-Katalog](README.md) · [English](../../en/widgets/input.md)

Ein natives VIS-2-Feld zur Eingabe von Text oder Zahlen.
Template-ID: `tplVis2-materialdesign-Input`.

<img src="../../media/vis2_input_runtime.png" alt="Material-Design-Eingabefeld in VIS 2">

## Editor-Einstellungen

Der Screenshot zeigt die Gruppen **Allgemein** und **Layout Eingabe**
aufgeklappt. Nicht aufgeführte Einstellungen sind selbsterklärend.

<img src="../../media/vis2_input_editor_overview.png" width="340" alt="Eingabe Allgemein und Layout">

**Allgemein**

- **Typ** – Text, Zahl, Datum, Zeit oder **Maske**.
- **Eingabemaske / max. Länge** – festes Eingabemuster und Zeichenbegrenzung für den Masken-Typ.

**Layout Eingabe**

- **Layout** – outlined, filled, solo (randlos) sowie die rounded-/shaped-Varianten.
- **Ausrichtung** – horizontale Ausrichtung des eingegebenen Texts.
- **Hintergrundfarbe hover** – füllt die Stufe zwischen Ruhezustand und Fokus. Leer gelassen bleibt die Ruhefarbe stehen.

**Untertext der Eingabe**

- **Text** – der Hinweis unter dem Feld, mit eigener Schriftart, -größe und -farbe.
- **immer anzeigen** – eingeschaltet steht der Hinweis dauerhaft unter dem Feld, ausgeschaltet erscheint er nur, solange das Feld fokussiert ist — wie bei [Select](select.md).

Zeichenzähler und Löschen-Icon (**Zählerlayout**) sowie Beschriftungen,
Prefix/Suffix, innere Icons und Farben liegen in eigenen optionalen Gruppen.

**Symbole**

Für das Löschen-, das vorangestellte, das innere vorangestellte, das angehängte
und das äußere angehängte Symbol lässt sich ein Icon oder ein Bild auswählen.

<img src="../../media/vis2_input_editor_icons.png" width="340" alt="Eingabe-Symbolfelder">

Für die Auswahl aus einer Werteliste nutze stattdessen das [Select](select.md)-Widget.
