# Warnmeldungen

[Zurück zur README](../../../README.md#widget-documentation)

Zeigt eine JSON-Warteschlange als Material-Design-Meldungen. Geschlossene
Meldungen werden aus dem State entfernt. Template-ID:
`tplVis2-materialdesign-Alerts`.

<img src="../../media/vis2_alerts_runtime.png" alt="Material-Design-Warnmeldungen in VIS 2">

## Editor-Einstellungen

<table>
<tr><td><img src="../../media/vis2_alerts_editor_overview.png" width="300"></td>
<td><ul><li>JSON-Objekt-ID und maximale Zahl sichtbarer Meldungen wählen.</li><li>Normales, umrandetes oder Kachel-Layout einstellen.</li><li>Dichte, Höhe, Rand, Schrift und Schließen-Icon konfigurieren.</li></ul></td></tr>
</table>

```json
[
    {
        "text": "Fenster ist offen",
        "icon": "alert-outline",
        "backgroundColor": "#fff8e1",
        "borderColor": "#ffc107",
        "iconColor": "#ffc107",
        "fontColor": "#333333"
    }
]
```

Der State muss ein JSON-Array enthalten. Ungültiges JSON erscheint als Fehler.
