import type { Example, FamilyExamples } from '../example';

const BAR = { width: 280, height: 24 };
const RING = { width: 96, height: 96 };
const D = '0_userdata.0.demo.';

const typical = (en: string, de: string): Pick<Example, 'id' | 'label' | 'purpose'> => ({ id: 'typical', label: { en: 'Typical', de: 'Typisch' }, purpose: { en, de } });
const text = (id: string, en: string, de: string, pen: string, pde: string): Pick<Example, 'id' | 'label' | 'purpose'> => ({ id, label: { en, de }, purpose: { en: pen, de: pde } });

const thresholds = { oid: `${D}devices.sensorBattery`, colorProgress: '#d32f2f', colorOneCondition: 20, colorOne: '#f9a825', colorTwoCondition: 50, colorTwo: '#43a047' };
const thresholdText = text('thresholds', 'Color by level', 'Farbe nach Stand', 'Red up to 20 %, amber up to 50 %, green above: a sensor battery at 12 %.', 'Rot bis 20 %, Gelb bis 50 %, Grün darüber: eine Sensorbatterie bei 12 %.');
const power = { oid: `${D}energy.pv`, min: 0, max: 5000, valueLabelStyle: 'progressValue', valueLabelUnit: 'W' };
const powerText = text('value', 'Value with unit', 'Wert mit Einheit', 'Shows the solar power in watts instead of a percentage of the 5 kW peak.', 'Zeigt die Solarleistung in Watt statt in Prozent der 5 kW Spitze.');
const busyText = text('indeterminate', 'Busy, no known end', 'Beschäftigt, ohne bekanntes Ende', 'Moves without a value, for example while a device updates.', 'Läuft ohne Wert, zum Beispiel während ein Gerät aktualisiert.');

export const progress: FamilyExamples = {
    MaterialDesignProgress: [
        { ...typical('Shows the house battery level with the percentage at the end.', 'Zeigt den Ladestand der Hausbatterie mit dem Prozentwert am Ende.'), size: BAR, data: { oid: `${D}energy.battery` } },
        { ...thresholdText, size: BAR, data: thresholds },
        { ...powerText, size: BAR, data: power },
        { ...text('striped', 'Striped with own text', 'Gestreift mit eigenem Text', 'Stripes mark a running program; the text names the appliance.', 'Streifen kennzeichnen ein laufendes Programm; der Text nennt das Gerät.'), size: BAR, data: { oid: `${D}appliances.dishwasher`, progressStriped: true, stripDistance: 24, valueLabelStyle: 'progressCustom', valueLabelCustom: 'Dishwasher [#percent] %', textAlign: 'center' } },
        { ...text('writable', 'Tap to set', 'Tippen zum Setzen', 'Writable: a tap or drag on the bar moves the blind there.', 'Beschreibbar: Tippen oder Ziehen auf dem Balken fährt den Rollladen dorthin.'), size: BAR, data: { oid: `${D}living.blind`, progressWritable: true, progressRounded: false } },
        { ...busyText, size: BAR, data: { oid: `${D}appliances.dishwasher`, progressIndeterminate: true, showValueLabel: false } },
    ],
    MaterialDesignProgressCircular: [
        { ...typical('Shows the house battery level as a ring with the percentage inside.', 'Zeigt den Ladestand der Hausbatterie als Ring mit dem Prozentwert innen.'), size: RING, data: { oid: `${D}energy.battery` } },
        { ...thresholdText, size: RING, data: thresholds },
        { ...powerText, size: { width: 120, height: 120 }, data: power },
        { ...text('thick', 'Thick ring', 'Dicker Ring', 'A wider ring reads better from a distance, here the humidity.', 'Ein breiterer Ring ist aus der Entfernung besser lesbar, hier die Luftfeuchte.'), size: RING, data: { oid: `${D}climate.living.humidity`, progressCircularWidth: 10 } },
        { ...busyText, size: RING, data: { oid: `${D}appliances.dishwasher`, progressIndeterminate: true, showValueLabel: false } },
    ],
};
