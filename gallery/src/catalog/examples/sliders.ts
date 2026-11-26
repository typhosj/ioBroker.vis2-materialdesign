import type { Example, FamilyExamples } from '../example';

const LINE = { width: 280, height: 48 };
const ROUND = { width: 200, height: 200 };
const D = '0_userdata.0.demo.';

const typical = (en: string, de: string): Pick<Example, 'id' | 'label' | 'purpose'> => ({ id: 'typical', label: { en: 'Typical', de: 'Typisch' }, purpose: { en, de } });
const text = (id: string, en: string, de: string, pen: string, pde: string): Pick<Example, 'id' | 'label' | 'purpose'> => ({ id, label: { en, de }, purpose: { en: pen, de: pde } });

const dimmer = { oid: `${D}living.dimmer`, min: 0, max: 100, valueLabelUnit: '%', prepandText: 'Living room', prepandTextWidth: 96 };
const setpoint = { oid: `${D}climate.setpoint`, min: 5, max: 30, step: 0.5, valueLabelUnit: '°C' };

export const sliders: FamilyExamples = {
    MaterialDesignSlider: [
        { ...typical('Dims a light; the name in front, the value behind.', 'Dimmt ein Licht; vorne der Name, hinten der Wert.'), size: LINE, data: dimmer },
        { ...text('ticks', 'Scale with captions', 'Skala mit Beschriftung', 'Three captions under the track give three ticks, here for the color temperature.', 'Drei Beschriftungen unter der Spur ergeben drei Striche, hier für die Farbtemperatur.'), size: { width: 280, height: 64 }, data: { oid: `${D}living.colorTemperature`, min: 2200, max: 6500, step: 100, valueLabelUnit: 'K', valueLabelWidth: 64, prepandText: 'Light color', prepandTextWidth: 96, showTicks: 'always', tickLabels: 'Warm,Neutral,Cold' } },
        { ...text('thumb-label', 'Value on the knob', 'Wert am Regler', 'The value rides on the knob instead of behind the track.', 'Der Wert sitzt am Regler statt hinter der Spur.'), size: { width: 280, height: 72 }, data: { oid: `${D}media.volume`, min: 0, max: 100, prepandText: 'Volume', prepandTextWidth: 96, showValueLabel: false, showThumbLabel: 'always' } },
        { ...text('own-colors', 'Own colors', 'Eigene Farben', 'Warm amber for a light instead of the theme color.', 'Warmes Bernstein für ein Licht statt der Theme-Farbe.'), size: LINE, data: { ...dimmer, oid: `${D}bedroom.dimmer`, prepandText: 'Bedroom', colorBeforeThumb: '#ffa000', colorThumb: '#ffa000', prepandTextColor: '#ffa000', valueLabelColor: '#ffa000' } },
        { ...text('read-only', 'Read only', 'Nur Anzeige', 'Shows the blind position the automation sets; dimmed and not draggable.', 'Zeigt die Rollladenposition, die die Automatik setzt; abgeblendet und nicht verschiebbar.'), size: LINE, data: { ...dimmer, oid: `${D}living.blind`, prepandText: 'Blind', readOnly: true } },
        { ...text('vertical', 'Vertical, big knob', 'Senkrecht, großer Regler', 'A blind position as a vertical track with a knob sized for a finger.', 'Eine Rollladenposition als senkrechte Spur mit einem Regler in Fingergröße.'), size: { width: 64, height: 200 }, data: { oid: `${D}living.blind`, min: 0, max: 100, valueLabelUnit: '%', orientation: 'vertical', knobSize: 'knobBig' } },
    ],
    MaterialDesignRoundSlider: [
        { ...typical('Sets the room temperature in half degrees; the value sits in the middle.', 'Stellt die Raumtemperatur in halben Grad; der Wert steht in der Mitte.'), size: ROUND, data: setpoint },
        { ...text('half', 'Half circle', 'Halbkreis', 'A 180° arc from left to right, like a gauge.', 'Ein 180°-Bogen von links nach rechts, wie ein Zeigerinstrument.'), size: ROUND, data: { oid: `${D}living.dimmer`, min: 0, max: 100, valueLabelUnit: '%', startAngle: 180, arcLength: 180 } },
        { ...text('full', 'Full circle', 'Vollkreis', 'A closed ring that starts at the bottom.', 'Ein geschlossener Ring, der unten beginnt.'), size: ROUND, data: { oid: `${D}media.volume`, min: 0, max: 100, valueLabelUnit: '%', startAngle: 90, arcLength: 360 } },
        { ...text('end-texts', 'Text at the ends', 'Text an den Enden', 'Words instead of 0 and 100: the closed blind reads "Closed".', 'Worte statt 0 und 100: der geschlossene Rollladen zeigt „Closed“.'), size: ROUND, data: { oid: `${D}bedroom.blind`, min: 0, max: 100, valueLabelUnit: '%', valueLabelMin: 'Closed', valueLabelMax: 'Open' } },
        { ...text('gauge', 'Read-only gauge', 'Anzeige-Instrument', 'Read only, without knob and with a thicker arc: shows the humidity.', 'Nur Anzeige, ohne Regler und mit dickerem Bogen: zeigt die Luftfeuchte.'), size: ROUND, data: { oid: `${D}climate.living.humidity`, min: 0, max: 100, valueLabelUnit: '%', readOnly: true, handleSize: 0, sliderWidth: 8 } },
    ],
};
