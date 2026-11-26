import type { Example, FamilyExamples } from '../example';

const VALUE = { width: 200, height: 40 };
const LABELED = { width: 260, height: 40 };
const ICON = { width: 48, height: 48 };
const D = '0_userdata.0.demo.';

const typical = (en: string, de: string): Pick<Example, 'id' | 'label' | 'purpose'> => ({ id: 'typical', label: { en: 'Typical', de: 'Typisch' }, purpose: { en, de } });
const text = (id: string, en: string, de: string, pen: string, pde: string): Pick<Example, 'id' | 'label' | 'purpose'> => ({ id, label: { en, de }, purpose: { en: pen, de: pde } });

export const values: FamilyExamples = {
    MaterialDesignValue: [
        { ...typical('A room temperature with icon, unit and one decimal.', 'Eine Raumtemperatur mit Icon, Einheit und einer Nachkommastelle.'), size: VALUE, data: { oid: `${D}climate.living.temperature`, image: 'thermometer', valueLabelUnit: '°C', minDecimals: 1, maxDecimals: 1 } },
        { ...text('boolean', 'Yes/no as words', 'Ja/Nein als Worte', 'A door contact shows "closed" or "open" instead of false and true.', 'Ein Türkontakt zeigt „closed“ oder „open“ statt false und true.'), size: LABELED, data: { oid: `${D}contacts.frontDoor`, image: 'door', prepandText: 'Front door', textOnTrue: 'open', textOnFalse: 'closed' } },
        { ...text('calculate', 'Converted value', 'Umgerechneter Wert', 'The calculation turns watts into kilowatts with two decimals.', 'Die Berechnung macht aus Watt Kilowatt mit zwei Nachkommastellen.'), size: VALUE, data: { oid: `${D}energy.power`, image: 'flash', calculate: '#value / 1000', valueLabelUnit: 'kW', minDecimals: 2, maxDecimals: 2 } },
        { ...text('condition', 'Text by condition', 'Text nach Bedingung', 'A condition on the rain chance picks one of two texts.', 'Eine Bedingung auf die Regenwahrscheinlichkeit wählt einen von zwei Texten.'), size: LABELED, data: { oid: `${D}weather.rain`, image: 'umbrella', targetType: 'boolean', condition: '#value > 50', textOnTrue: 'Take an umbrella', textOnFalse: 'Stays dry' } },
        { ...text('duration', 'Seconds as duration', 'Sekunden als Dauer', 'The remaining program time in seconds, shown as hours and minutes.', 'Die Restlaufzeit in Sekunden, als Stunden und Minuten gezeigt.'), size: LABELED, data: { oid: `${D}appliances.dishwasherRemaining`, image: 'dishwasher', prepandText: 'Ready in', convertToDuration: 'h:mm [h]' } },
        { ...text('last-change', 'Last change', 'Letzte Änderung', 'The time stamp of the last change instead of the value: when the window was opened.', 'Der Zeitstempel der letzten Änderung statt des Werts: wann das Fenster geöffnet wurde.'), size: LABELED, data: { oid: `${D}contacts.kitchenWindow`, image: 'window-open-variant', prepandText: 'Opened at', valueAttribute: 'lc', convertToTimestamp: 'HH:mm' } },
        { ...text('large', 'Large number', 'Große Zahl', 'A big outdoor temperature as the headline of a weather tile, aligned to the end.', 'Eine große Außentemperatur als Überschrift einer Wetterkachel, am Ende ausgerichtet.'), size: { width: 200, height: 56 }, data: { oid: `${D}weather.temperature`, valueLabelUnit: '°C', minDecimals: 1, maxDecimals: 1, valuesFontSize: 32, textAlign: 'end', image: '' } },
    ],
    MaterialDesignIcon: [
        { ...typical('A single icon in the theme color, for a label or a tile corner.', 'Ein einzelnes Icon in der Theme-Farbe, für eine Beschriftung oder eine Kachelecke.'), size: ICON, data: { mdwIcon: 'lightbulb-outline', mdwIconSize: 36 } },
        { ...text('own-color', 'Own color', 'Eigene Farbe', 'Warm amber instead of the theme color.', 'Warmes Bernstein statt der Theme-Farbe.'), size: ICON, data: { mdwIcon: 'lightbulb-on', mdwIconSize: 36, mdwIconColor: '#ffa000' } },
        { ...text('large', 'Large', 'Groß', 'A large weather symbol as the eye-catcher of a tile.', 'Ein großes Wettersymbol als Blickfang einer Kachel.'), size: { width: 96, height: 96 }, data: { mdwIcon: 'weather-partly-cloudy', mdwIconSize: 88 } },
    ],
    MaterialDesignInstalledVersion: [
        { ...typical('Shows which adapter version runs, for an info or settings view.', 'Zeigt, welche Adapterversion läuft, für eine Info- oder Einstellungsansicht.'), size: { width: 200, height: 32 }, data: {} },
    ],
    MaterialDesignColorScheme: [
        { ...typical('A reference of all chart color schemes with their names, to pick one while building a view.', 'Eine Übersicht aller Diagramm-Farbschemata mit Namen, um beim Bauen einer Ansicht eines auszuwählen.'), size: { width: 'fill', height: 480 }, data: {} },
    ],
};
