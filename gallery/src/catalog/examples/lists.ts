import type { Example, FamilyExamples } from '../example';

const D = '0_userdata.0.demo.';
// Material 3 rows are 56 px high (two lines 72), Classic rows 48 px; the sizes fit both.
const LIST = { width: 320, height: 176 };
const ICONS = { width: 360, height: 112 };
const TABLE = { width: 480, height: 216 };
const CARD = { width: 320, height: 300 };
const ALERTS = { width: 360, height: 150 };

const typical = (en: string, de: string): Pick<Example, 'id' | 'label' | 'purpose'> => ({ id: 'typical', label: { en: 'Typical', de: 'Typisch' }, purpose: { en, de } });
const text = (id: string, en: string, de: string, pen: string, pde: string): Pick<Example, 'id' | 'label' | 'purpose'> => ({ id, label: { en, de }, purpose: { en: pen, de: pde } });

type Row = { oid?: string; label: string; sub?: string; right?: string; icon?: string; header?: string; value?: string; nav?: string };
const rows = (items: Row[], divider = true): Record<string, unknown> => Object.assign({ countListItems: items.length }, ...items.map((row, i) => ({
    ...(row.oid ? { [`oid${i}`]: row.oid } : {}),
    [`label${i}`]: row.label,
    ...(row.sub ? { [`subLabel${i}`]: row.sub } : {}),
    ...(row.right ? { [`rightLabel${i}`]: row.right } : {}),
    ...(row.icon ? { [`listImage${i}`]: row.icon } : {}),
    ...(row.header ? { [`groupHeader${i}`]: row.header } : {}),
    ...(row.value ? { [`listTypeButtonStateValue${i}`]: row.value } : {}),
    ...(row.nav ? { [`listTypeButtonNav${i}`]: row.nav } : {}),
    [`dividers${i}`]: divider,
})));

const lights: Row[] = [
    { oid: `${D}living.light`, label: 'Living room', sub: 'Ceiling light', icon: 'ceiling-light' },
    { oid: `${D}kitchen.light`, label: 'Kitchen', sub: 'Under-cabinet light', icon: 'wall-sconce-flat' },
    { oid: `${D}terrace.light`, label: 'Terrace', sub: 'Wall light', icon: 'outdoor-lamp' },
];
const windows: Row[] = [
    { oid: `${D}contacts.livingWindow`, label: 'Living room window', icon: 'window-closed-variant' },
    { oid: `${D}contacts.kitchenWindow`, label: 'Kitchen window', icon: 'window-closed-variant' },
    { oid: `${D}contacts.bedroomWindow`, label: 'Bedroom window', icon: 'window-closed-variant' },
];
const views: Row[] = [
    { label: 'Lights', sub: 'All rooms', icon: 'lightbulb-group', nav: 'demo-lights' },
    { label: 'Climate', sub: 'Heating and air', icon: 'thermometer', nav: 'demo-climate' },
    { label: 'Media', sub: 'Music and radio', icon: 'music', nav: 'demo-media' },
];
const scenes: Row[] = [
    { oid: `${D}general.scene`, label: 'Morning', icon: 'weather-sunset-up', value: 'morning' },
    { oid: `${D}general.scene`, label: 'Day', icon: 'white-balance-sunny', value: 'day' },
    { oid: `${D}general.scene`, label: 'Evening', icon: 'weather-sunset', value: 'evening' },
    { oid: `${D}general.scene`, label: 'Night', icon: 'weather-night', value: 'night' },
];

type Tile = { oid?: string; label: string; icon: string; value?: string; nav?: string };
const tiles = (items: Tile[], type: string): Record<string, unknown> => Object.assign({ countListItems: items.length }, ...items.map((tile, i) => ({
    [`listType${i}`]: type,
    ...(tile.oid ? { [`oid${i}`]: tile.oid } : {}),
    [`label${i}`]: tile.label,
    [`listImage${i}`]: tile.icon,
    [`showValueLabel${i}`]: false,
    ...(tile.value ? { [`listTypeButtonStateValue${i}`]: tile.value } : {}),
    ...(tile.nav ? { [`listTypeButtonNav${i}`]: tile.nav } : {}),
})));
const lightTiles: Tile[] = [
    { oid: `${D}living.light`, label: 'Living room', icon: 'ceiling-light' },
    { oid: `${D}kitchen.light`, label: 'Kitchen', icon: 'wall-sconce-flat' },
    { oid: `${D}terrace.light`, label: 'Terrace', icon: 'outdoor-lamp' },
];

const roomsJson = JSON.stringify([
    { room: 'Living room', temperature: 21.4, humidity: 46 },
    { room: 'Kitchen', temperature: 22.1, humidity: 52 },
    { room: 'Bedroom', temperature: 19.2, humidity: 49 },
]);
const rooms = {
    dataJson: roomsJson, countCols: 3,
    label0: 'Room', textAlign0: 'left',
    label1: 'Temperature', textAlign1: 'right', suffix1: ' °C',
    label2: 'Humidity', textAlign2: 'right', suffix2: ' %',
};

const welcome = { title: 'Welcome home', subtitle: '12 devices online', html: 'All windows closed', image: 'img/preview.jpg' };

export const lists: FamilyExamples = {
    MaterialDesignList: [
        { ...typical('Switches the lights of three rooms, one row each, as in a settings list.', 'Schaltet die Lichter dreier Räume, eine Zeile je Licht, wie in einer Einstellungsliste.'), size: LIST, data: { listType: 'switch', ...rows(lights) } },
        { ...text('status', 'Read-only status', 'Status nur lesen', 'Checkboxes that only show which windows are open.', 'Checkboxen, die nur zeigen, welche Fenster offen sind.'), size: LIST, data: { listType: 'checkbox_readonly', ...rows(windows) } },
        { ...text('menu', 'Menu to other views', 'Menü zu anderen Ansichten', 'Each row opens a view; the card frames the menu.', 'Jede Zeile öffnet eine Ansicht; die Karte rahmt das Menü.'), size: { width: 320, height: 224 }, data: { listType: 'buttonNav', listLayout: 'card', ...rows(views) } },
        { ...text('scenes', 'Scene buttons', 'Szenen-Buttons', 'Each row writes its scene to one data point; inset dividers in an outlined card.', 'Jede Zeile schreibt ihre Szene in einen Datenpunkt; eingerückte Trenner in einer umrandeten Karte.'), size: { width: 320, height: 240 }, data: { listType: 'buttonState', listLayout: 'cardOutlined', listItemDividerStyle: 'inset', ...rows(scenes) } },
        { ...text('groups', 'Group headers and right text', 'Gruppen und rechter Text', 'Headers split the rooms by floor; the right text holds the value (in a real view usually a binding).', 'Überschriften teilen die Räume nach Etage; der rechte Text trägt den Wert (in einer echten Ansicht meist ein Binding).'), size: { width: 320, height: 240 }, data: { listType: 'text', ...rows([
            { header: 'Ground floor', label: 'Living room', right: '21.4 °C', icon: 'sofa' },
            { label: 'Kitchen', right: '22.1 °C', icon: 'fridge' },
            { header: 'First floor', label: 'Bedroom', right: '19.2 °C', icon: 'bed' },
        ], false) } },
    ],
    MaterialDesignIconList: [
        { ...typical('Light tiles: a tap switches the light, the filled circle shows it is on.', 'Licht-Kacheln: ein Tipp schaltet das Licht, der gefüllte Kreis zeigt, dass es an ist.'), size: ICONS, data: { maxItemsperRow: 3, ...tiles(lightTiles, 'buttonToggle') } },
        { ...text('scenes', 'Scene buttons', 'Szenen-Buttons', 'Four buttons write their scene into one data point; square buttons.', 'Vier Buttons schreiben ihre Szene in einen Datenpunkt; eckige Buttons.'), size: { width: 480, height: 112 }, data: { buttonLayout: 'square', maxItemsperRow: 4, ...tiles(scenes, 'buttonState') } },
        { ...text('horizontal', 'Text beside the icon', 'Text neben dem Icon', 'Horizontal items in a card, for a narrow column.', 'Waagerechte Einträge in einer Karte, für eine schmale Spalte.'), size: { width: 220, height: 200 }, data: { itemLayout: 'horizontal', listLayout: 'card', maxItemsperRow: 1, ...tiles(lightTiles, 'buttonToggle') } },
        { ...text('menu', 'Menu to other views', 'Menü zu anderen Ansichten', 'Full-width buttons open other views, in an outlined card.', 'Breite Buttons öffnen andere Ansichten, in einer umrandeten Karte.'), size: { width: 360, height: 112 }, data: { buttonLayout: 'full', listLayout: 'cardOutlined', maxItemsperRow: 3, ...tiles(views.map(v => ({ label: v.label, icon: v.icon!, nav: v.nav })), 'buttonNav') } },
    ],
    MaterialDesignTable: [
        { ...typical('Temperature and humidity of three rooms from a JSON text, values aligned to the right.', 'Temperatur und Luftfeuchte dreier Räume aus einem JSON-Text, Werte rechtsbündig.'), size: TABLE, data: rooms },
        { ...text('card', 'Card', 'Karte', 'The same table framed as a card.', 'Dieselbe Tabelle als Karte gerahmt.'), size: { width: 480, height: 224 }, data: { ...rooms, tableLayout: 'cardOutlined' } },
        { ...text('state', 'From a JSON state', 'Aus einem JSON-Datenpunkt', 'Reads the weather forecast from a data point; the icon column is hidden.', 'Liest die Wettervorhersage aus einem Datenpunkt; die Icon-Spalte ist ausgeblendet.'), size: { width: 480, height: 320 }, data: { oid: `${D}weather.forecast`, countCols: 4, label0: 'Day', textAlign0: 'left', showColumn1: false, label2: 'Max', textAlign2: 'right', suffix2: ' °C', label3: 'Min', textAlign3: 'right', suffix3: ' °C' } },
        { ...text('compact', 'Compact without header', 'Kompakt ohne Kopfzeile', 'Lower rows and no header row, for a small tile.', 'Niedrigere Zeilen und keine Kopfzeile, für eine kleine Kachel.'), size: { width: 320, height: 160 }, data: { ...rooms, showHeader: false, rowHeight: 32 } },
    ],
    MaterialDesignCard: [
        { ...typical('A welcome card with picture, title, subtitle and text.', 'Eine Willkommenskarte mit Bild, Titel, Untertitel und Text.'), size: CARD, data: welcome },
        { ...text('text-only', 'Outlined, without picture', 'Umrandet, ohne Bild', 'A text card for the weather, framed by an outline.', 'Eine Textkarte für das Wetter, mit einer Umrandung gerahmt.'), size: { width: 320, height: 160 }, data: { cardStyle: 'outlined', title: 'Weather', subtitle: 'Partly cloudy, 17.5 °C', html: 'Rain chance 20 %<br>Wind 12 km/h', image: '' } },
        { ...text('header', 'Title above the picture', 'Titel über dem Bild', 'Layout BasicHeader: the title comes first.', 'Layout BasicHeader: zuerst der Titel.'), size: CARD, data: { ...welcome, cardLayout: 'BasicHeader' } },
        { ...text('overlay', 'Title on the picture', 'Titel auf dem Bild', 'Layout BasicHeaderOverlay: the title lies on the picture, on a dark band so it stays readable on any photo.', 'Layout BasicHeaderOverlay: der Titel liegt auf dem Bild, auf einem dunklen Band, damit er auf jedem Foto lesbar bleibt.'), size: CARD, data: { ...welcome, cardLayout: 'BasicHeaderOverlay', colorTitleSectionBackground: 'rgba(0, 0, 0, 0.5)', colorTitle: '#ffffff', colorSubtitle: 'rgba(255, 255, 255, 0.8)' } },
        { ...text('horizontal', 'Picture beside the text', 'Bild neben dem Text', 'Layout Horizontal, for a wide and low tile.', 'Layout Horizontal, für eine breite, niedrige Kachel.'), size: { width: 440, height: 180 }, data: { ...welcome, cardLayout: 'Horizontal' } },
    ],
    MaterialDesignAlerts: [
        { ...typical('Open notifications from a JSON data point, with a colored stripe per message; the cross removes one.', 'Offene Meldungen aus einem JSON-Datenpunkt, mit farbigem Streifen je Meldung; das Kreuz entfernt eine.'), size: ALERTS, data: { oid: `${D}notifications.alerts`, alertDense: false, alertBorderLayout: 'left', alertMarginBottom: 12 } },
        { ...text('outlined', 'Outlined', 'Umrandet', 'An outline instead of a filled background.', 'Eine Umrandung statt einer gefüllten Fläche.'), size: ALERTS, data: { oid: `${D}notifications.alerts`, alertLayouts: 'outlined', alertDense: false, alertElevation: 0, alertMarginBottom: 12 } },
        { ...text('tile', 'Tile with top stripe', 'Kachel mit Streifen oben', 'Square corners and the stripe on top.', 'Eckige Ecken und der Streifen oben.'), size: ALERTS, data: { oid: `${D}notifications.alerts`, alertLayouts: 'tile', alertDense: false, alertBorderLayout: 'top', alertMarginBottom: 12 } },
        { ...text('dense', 'Dense', 'Kompakt', 'Lower messages with a smaller font, for a sidebar.', 'Niedrigere Meldungen mit kleinerer Schrift, für eine Seitenleiste.'), size: { width: 300, height: 110 }, data: { oid: `${D}notifications.alerts`, alertDense: true, alertFontSize: 14, alertIconSize: 20, alertBorderLayout: 'left', alertMarginBottom: 8 } },
    ],
};
