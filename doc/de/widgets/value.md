# Wertanzeige

[Anwenderhandbuch](../README.md) › [Widget-Katalog](README.md) · [English](../../en/widgets/value.md)

Zeigt einen ioBroker-Zustand als Text, Zahl, Bool-Wert oder verknüpften Wert an –
mit Formatierung, Präfix/Suffix und optionalem Icon. Template-ID:
`tplVis2-materialdesign-value`.

<img src="../../media/vis2_value_runtime.png" alt="Material-Design-Wertanzeige in VIS 2">

## Editor-Einstellungen

Die Screenshots zeigen die Gruppen, die die Ausgabe bestimmen. Nicht
aufgeführte Einstellungen sind selbsterklärend.

<img src="../../media/vis2_value_editor_overview.png" width="340" alt="Wertanzeige Allgemein und Zahlenformat">

**Allgemein**

- **Zieltyp** – wie der State interpretiert wird: `automatisch`, Zahl, Text, boolesch oder *verknüpft* (klickbarer Wert, der das Objekt öffnet).
- **Präfix / Suffix** – fester Text vor / nach dem Wert (Einheit, Beschriftung).

**Zahlenformatierung**

- **Min./Max.-Nachkommastellen** – Anzahl der angezeigten Dezimalstellen.
- **Einheit** – an die Zahl angehängter Einheitentext.
- **Berechnung** – mathematischer Ausdruck, der vor der Anzeige auf den Wert angewendet wird (z. B. `x/1000` für Wh → kWh).
- **in Dauer / in Zeitstempel umwandeln** – eine Sekundenzahl als `hh:mm:ss` bzw. einen Zeitstempel als formatiertes Datum/Zeit darstellen.

<img src="../../media/vis2_value_editor_2.png" width="340" alt="Wertanzeige Symbol-Optionen">

**Symbol**

- **Bild** – Material-Design-Iconname, Bildpfad/URL oder Data-URL neben dem Wert.
- **Icon-Position** – vor oder nach dem Wert.
- **Icon-Farbe / -Höhe** – Umfärben (einfarbiges SVG) und Größe des Icons.

Eine eigene Gruppe **Logikwert Formatierung** erscheint, sobald der Zieltyp
boolesch ist: Sie enthält die **Texte für true / false** und eine **Bedingung**,
die bei nicht-booleschen Eingaben über den true/false-Zustand entscheidet.

**Wertänderungseffekt**

- **aktiviert** – bei jeder Wertänderung wechselt der Wert für die eingestellte
  **Dauer** (Voreinstellung 750 ms) auf Effekt-Schriftfarbe und -größe und kehrt
  danach zurück. Der erste Wert ist das Eintreffen des States und keine
  Änderung — ein Dashboard leuchtet beim Laden also nicht auf.

**Verknüpfter Wert**

- **Beim Laden versteckt** – hält das Widget unsichtbar, bis sein State da ist.
  Es belegt seinen Platz weiterhin, sodass das Layout nicht springt, sobald der
  Wert erscheint.

