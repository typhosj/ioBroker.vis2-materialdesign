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

**Daten des Menüs**

- **Datenmethode** – *Werteliste*, *JSON-String*, *JSON-Objekt* oder *States des Objekts* (nutzt die enum-Werte des verknüpften Objekts).
- **Werteliste / Texte / Icons** – semikolongetrennte Listen, die die Einträge bilden, z. B. Werte `1;2;3`, Texte `Wohnzimmer;Küche;Bad`, Icons `sofa;silverware-fork-knife;shower`.

**Menü-Layout**

- **Listenposition / Versatz** – wo das Dropdown relativ zum Feld öffnet.
- **gewähltes Icon zeigen** – markiert den aktiven Eintrag mit einem Haken.
- **beim Leeren öffnen** – öffnet die Liste nach dem Löschen erneut.

**Menüpunkt**

- Pro Eintrag **Wert**, **Text**, **Untertext**, **Icon** und **Icon-Farbe**, wenn die Einträge im Editor gepflegt werden.
- Einen Eintrag legt der **+**-Knopf in der Kopfzeile der letzten Gruppe **Menüpunkt** an, kopieren und löschen die beiden Knöpfe daneben. Diese letzte Gruppe zeigt nur ihre Kopfzeile — sie ist die Hinzufügen-Leiste, kein Eintrag.
- Ein Eintrag ohne **Wert** übernimmt seinen **Text** als Wert, der ins Objekt geschrieben wird.

Die Gruppe **Layout Eingabe** (outlined / filled / solo, rounded / shaped)
entspricht dem [Eingabe](input.md)-Widget. Beschriftungen, Löschen-/Aufklapp-Icons
und Farben liegen in eigenen optionalen Gruppen. JSON-Einträge können `value`,
`text`, `subText`, `icon` und `iconColor` nutzen.

**Untertext der Eingabe**

- **Text** – ein Hinweis unter dem Feld, mit eigener Schriftart, -größe und -farbe.
- **immer anzeigen** – eingeschaltet steht der Hinweis dauerhaft unter dem Feld,
  ausgeschaltet erscheint er nur, solange die Liste geöffnet ist.

**Zählerlayout**

- **Zähler anzeigen** – gibt aus, wie viele Einträge die Liste anbietet. Das ist
  eine Anzahl von Einträgen, keine Zeichenzahl: ein Select hat kein Maximum, gegen
  das gezählt werden könnte.

**Layout Eingabe** (weitere Felder)

- **Hintergrundfarbe hover / selektiert** und **Randfarbe hover** füllen die
  beiden Stufen zwischen Ruhezustand und geöffneter Liste. Jede Stufe fällt auf
  die vorherige zurück, wenn sie nicht gesetzt ist — ein Feld mit nur einer
  Ruhefarbe sieht also unverändert aus.
- **automatisch fokussieren** – fokussiert das Feld beim Öffnen der View. Im
  Editor bleibt es aus, wo ein Feld, das sich beim Anordnen den Fokus greift, nur
  stört.

**Beschriftung der Eingabe**

- **Versatz x / y** verschieben die Beschriftung, wie beim [Eingabe](input.md)-Widget.

**Symbole**

Für das Löschen-, das Aufklapp- (Menüpfeil), das vorangestellte, das innere
vorangestellte und das äußere angehängte Symbol lässt sich ein Icon oder ein
Bild auswählen.

<img src="../../media/vis2_select_editor_icons.png" width="340" alt="Select-Symbolfelder">

## Nur Autocomplete

Autocomplete bringt zwei eigene Felder neben den gemeinsamen mit:

- **Eingabemodus** – *write* nimmt freien Text an, *select* lässt nur Einträge
  aus der Liste zu.
- **Eingabetyp** – `text`, `date` oder `time` für das Filterfeld. `date` und
  `time` übergeben an die Auswahl des Browsers, alles andere bleibt Text. Ein
  Select hat keine Texteingabe, deshalb gibt es diese Einstellung nur bei
  Autocomplete.

