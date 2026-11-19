# IconList

[Anwenderhandbuch](../README.md) › [Widget-Katalog](README.md) · [English](../../en/widgets/iconlist.md)

Zeigt zustandsabhängige Icons in einem responsiven VIS-2-Raster. Daten werden im
Editor eingegeben oder aus JSON gelesen. Template-ID:
`tplVis2-materialdesign-Icon-List`.

<img src="../../media/vis2_iconlist_runtime.png" alt="Material-Design-IconList in VIS 2">

## Editor-Einstellungen

Die Screenshots zeigen die Datengruppen und das Raster-Layout. Nicht aufgeführte
Einstellungen sind selbsterklärend.

<img src="../../media/vis2_iconlist_editor_overview.png" width="340" alt="IconList Daten und Eintrag">

**Daten der Liste**

- **Eingabemethode für die Listendaten** – `über den Editor` oder `JSON-String`.
- **Editor: Anzahl der Listenelemente** – wie viele indizierte Eintragsgruppen es gibt.
- **Objekt-ID** – der State mit dem JSON-Array, nur bei der Methode `JSON-String`.

Jede Zelle wird in ihrer eigenen indizierten Gruppe **Layout des Listenelements [n]** konfiguriert.
Anders als bei der [Liste](list.md) hat **jede Zelle ihre eigene Art**:

- **Art der Liste** – `Text`, `Button State`, `Button Toggle`,
  `Button Toggle Wert: ist nur aktiviert, wenn …`,
  `Button Toggle Wert: ist nur deaktiviert, wenn …`, `Button Navigation` oder
  `Button Link`. Ohne passenden Vergleichswert gilt eine Zelle als aktiv, sobald
  ihr State `true` ist.
- **Objekt-ID** – der die Zelle steuernde State.
- **Nur lesen** – zeigt den Zustand, schreibt aber nichts.
- **Symbol / Symbolfarbe** und **Symbol aktiv / Symbolfarbe aktiv** – Aus- und Ein-Zustand des Icons; ohne Aktiv-Werte bleiben die normalen stehen.
- **Beschriftung / zweiter Text** – Texte an der Zelle.
- **Wert anzeigen** (Vorgabe an) blendet den State-Wert ein, **Text, der an den Wert angehängt werden soll** hängt eine Einheit an.
- **Farbe der Statusleiste (wenn aktiv) / Text der Statusleiste (wenn aktiv)** – schmaler Streifen am unteren Rand der Zelle.
- **minimale Breite** und **x Prozent der Zeile verwenden** – Breite dieser einen Zelle abweichend vom Raster.
- **Objekt ID für die Sichtbarkeit**, **Bedingung für die Sichtbarkeit** und **Wert für die Sichtbarkeit** – blenden die Zelle aus, solange die Bedingung nicht zutrifft. Erlaubt sind `==` (Vorgabe), `!=`, `<`, `<=`, `>`, `>=`, `consist`, `not consist`, `exist` und `not exist`. Ohne Objekt-ID bleibt die Zelle sichtbar.
- **Verriegeln aktivieren** – diese Zelle muss erst entsperrt werden, bevor sie schaltet.

**Verriegeln** (listenweit)

- **automatisch Verriegeln nach [s]** – Vorgabe 10 Sekunden.
- **Symbol**, Position, Größe und Farbe des Schlosses.
- **Graufilter, wenn verriegelt** (Vorgabe 30 %) und **Graufilter nur auf das Symbol anwenden**.

Die Rasteranordnung liegt in der Gruppe **Allgemein**:

<img src="../../media/vis2_iconlist_editor_2.png" width="340" alt="IconList Raster-Layout">

- **Elemente umbrechen** / **Anzahl der maximalen Listenelemente pro Zeile** – wie Zellen in Zeilen fließen.
- **Abstand zwischen Elementen** – Abstand zwischen den Zellen.
- **zum aktiven Eintrag scrollen** – wird ein anderer Eintrag aktiv, scrollt die
  Liste in ihrem eigenen Rahmen, bis er zu sehen ist. View und Seite um das
  Widget bleiben stehen.

In der Gruppe **Layout des Listenelements** liegen **Layout** (`standard`, `Karte`,
`cardOutlined`), **Layout der Elemente** (`vertikal` oder `horizontal`, Icon über
oder neben dem Text), **Bildhöhe**, **minimale Breite / Höhe**, **Layout der
Schaltflächen** (`Rund`, `rechteckig`, `Komplett`) sowie Schriften und Farben der
drei Textzeilen.

Symbole akzeptieren Material-Design-Iconnamen und Bildquellen.

Bei der Methode `JSON-String` liefert der State ein Array von Objekten. Die
Schlüssel weichen von den Editor-Feldern ab: `objectId`, `text`, `subText`,
`image`, `imageColor`, `imageActive`, `imageActiveColor`, `background`,
`buttonBackgroundColor`, `buttonBackgroundActiveColor`, `buttonStateValue`,
`buttonToggleValueTrue`, `buttonToggleValueFalse`, `buttonNavView`, `buttonLink`;
`listType`, `minWidth`, `usePercentOfRow`, `readOnly`, `showValueLabel`,
`valueAppendix`, `statusBarColor`, `statusBarColorActive`, `statusBarText`,
`statusBarTextActive`, `lockEnabled`, `visibilityOid`, `visibilityCondition` und
`visibilityConditionValue` heißen wie im Editor. Über 100 Einträge werden
abgeschnitten.

## Nur lesen, Verriegeln und PIN

**Nur lesen** lässt sich an einen State binden: Das Kontrollkästchen daneben und das Bindungssymbol von VIS 2 schalten das Feld auf eine Bindung um. `{0_userdata.0.automatik}` sperrt das Widget, solange der State an ist; `{a:0_userdata.0.automatik;!a}` kehrt das um und sperrt es, solange der State aus ist. Ein gebundener Text `true` oder `1` zählt als an. Gilt je Eintrag. Nur lesen gewinnt immer über die Verriegelung: Ein schreibgeschütztes Widget reagiert auf nichts und öffnet keine PIN-Tafel. Ein gesperrtes, schreibgeschütztes Widget zeigt sein Schloss weiter; Eingabe, Auswahl, Autocomplete und Slider blenden es bei Nur lesen aus. Die Auto-Füllung setzt den Haken nur bei einem nicht beschreibbaren Objekt und überschreibt nie eine Bindung.

**PIN** (alle Widgets mit Verriegelung): 1 bis 12 Ziffern, leer heißt keine PIN. Mit PIN öffnet ein Tipp auf das Schloss eine Zifferntafel mit den Tasten 1 bis 9, Abbrechen, 0 und Löschen; sie prüft, sobald die PIN vollständig ist, wackelt bei falscher PIN und leert sich. Auch eine Hardware-Tastatur funktioniert (Ziffern, Rücktaste, Escape). Die richtige PIN entsperrt in diesem Browser alle Widgets mit derselben PIN, bis die Sperrzeit abläuft; ein Neuladen verriegelt wieder alles. Die PIN lässt sich an einen State binden, um eine zentrale PIN zu pflegen. Ist die gebundene PIN leer oder keine 1 bis 12 Ziffern lang, bleibt das Widget verriegelt und die Tafel meldet „PIN nicht eingerichtet“. Ein Zahlen-State verliert führende Nullen (aus 0123 wird 123); nutze für solche PINs einen Text-State. Im Editor öffnet sich die Tafel nie.

**Kein Sicherheitsmerkmal:** Die PIN steht im Klartext im Projekt und im State, und wer States schreiben darf, umgeht jede Verriegelung. Sie schützt vor versehentlichem Antippen und vor Kindern, nicht vor Angreifern.

## Gestaltungsstil

Die Stile **Klassisch** (links) und **Material 3** (rechts) nebeneinander, siehe
[Gestaltungsstil](../README.md#gestaltungsstil): die reine Textliste, Karte und
Karte outlined, Trenner inset, Switch- und Checkbox-Zeilen sowie die Icon-Liste.

<img src="../../media/vis2_list_styles.png" alt="Liste und Icon-Liste im klassischen und im Material-3-Stil">

Dieselben Widgets bei eingeschaltetem Dark-Theme:

<img src="../../media/vis2_list_styles_dark.png" alt="Liste und Icon-Liste im klassischen und im Material-3-Stil, dunkel">
