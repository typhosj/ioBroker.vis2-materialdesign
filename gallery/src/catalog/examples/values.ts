import type { FamilyExamples } from '../example';

export const values: FamilyExamples = {
    MaterialDesignColorScheme: [
        { id: 'typical', label: { en: 'Typical', de: 'Typical' }, purpose: { en: '', de: '' }, size: { width: 300, height: 60 }, data: {} },
        { id: 'compact', label: { en: 'Compact', de: 'Compact' }, purpose: { en: '', de: '' }, size: { width: 420, height: 240 }, data: {} },
        { id: 'wide', label: { en: 'Wide', de: 'Wide' }, purpose: { en: '', de: '' }, size: { width: 800, height: 360 }, data: {} },
    ],
    MaterialDesignIcon: [
        { id: 'typical', label: { en: 'Typical', de: 'Typical' }, purpose: { en: '', de: '' }, size: { width: 300, height: 60 }, data: {} },
        { id: 'icon-small', label: { en: 'Icon small', de: 'Icon small' }, purpose: { en: '', de: '' }, size: { width: 48, height: 48 }, data: { mdwIcon: 'lightbulb', mdwIconColor: '', mdwIconSize: 24 } },
        { id: 'icon-large', label: { en: 'Icon large', de: 'Icon large' }, purpose: { en: '', de: '' }, size: { width: 72, height: 72 }, data: { mdwIcon: 'lightbulb', mdwIconColor: '', mdwIconSize: 48 } },
        { id: 'icon-tinted', label: { en: 'Icon tinted', de: 'Icon tinted' }, purpose: { en: '', de: '' }, size: { width: 72, height: 72 }, data: { mdwIcon: 'lightbulb', mdwIconColor: '#00696d', mdwIconSize: 48 } },
    ],
    MaterialDesignInstalledVersion: [
        { id: 'typical', label: { en: 'Typical', de: 'Typical' }, purpose: { en: '', de: '' }, size: { width: 300, height: 60 }, data: {} },
        { id: 'small', label: { en: 'Small', de: 'Small' }, purpose: { en: '', de: '' }, size: { width: 90, height: 20 }, data: {} },
        { id: 'wide', label: { en: 'Wide', de: 'Wide' }, purpose: { en: '', de: '' }, size: { width: 200, height: 40 }, data: {} },
    ],
    MaterialDesignValue: [
        { id: 'typical', label: { en: 'Typical', de: 'Typical' }, purpose: { en: '', de: '' }, size: { width: 300, height: 60 }, data: { oid: '0_userdata.0.demo.general.value' } },
        { id: 'number-unit', label: { en: 'Number + unit', de: 'Number + unit' }, purpose: { en: '', de: '' }, size: { width: 220, height: 44 }, data: { oid: '0_userdata.0.demo.climate.living.temperature', image: '', imageColor: '#44739e', iconHeight: 24, valueLabelUnit: '°C', minDecimals: 1, maxDecimals: 1, textAlign: 'center' } },
        { id: 'boolean-as-text', label: { en: 'Boolean as text', de: 'Boolean as text' }, purpose: { en: '', de: '' }, size: { width: 220, height: 44 }, data: { oid: '0_userdata.0.demo.contacts.frontDoor', image: '', imageColor: '#44739e', iconHeight: 24, valueLabelUnit: 'kWh', minDecimals: 2, maxDecimals: 2, textAlign: 'center', textOnTrue: 'offen', textOnFalse: 'zu' } },
        { id: 'text-with-prefix', label: { en: 'Text with prefix', de: 'Text with prefix' }, purpose: { en: '', de: '' }, size: { width: 220, height: 44 }, data: { oid: '0_userdata.0.demo.climate.mode', image: '', imageColor: '#44739e', iconHeight: 24, valueLabelUnit: 'kWh', minDecimals: 2, maxDecimals: 2, textAlign: 'center', prepandText: 'Mode: ' } },
        { id: 'with-icon', label: { en: 'With icon', de: 'With icon' }, purpose: { en: '', de: '' }, size: { width: 220, height: 44 }, data: { oid: '0_userdata.0.demo.climate.living.temperature', image: 'thermometer', imageColor: '', iconHeight: 24, valueLabelUnit: '°C', minDecimals: 2, maxDecimals: 2, textAlign: 'center' } },
        { id: 'right-aligned', label: { en: 'Right-aligned', de: 'Right-aligned' }, purpose: { en: '', de: '' }, size: { width: 220, height: 44 }, data: { oid: '0_userdata.0.demo.climate.living.temperature', image: '', imageColor: '#44739e', iconHeight: 24, valueLabelUnit: '°C', minDecimals: 2, maxDecimals: 2, textAlign: 'end' } },
    ],
};
