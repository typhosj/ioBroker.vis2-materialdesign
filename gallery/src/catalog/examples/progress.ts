import type { FamilyExamples } from '../example';

export const progress: FamilyExamples = {
    MaterialDesignProgress: [
        { id: 'typical', label: { en: 'Typical', de: 'Typical' }, purpose: { en: '', de: '' }, size: { width: 300, height: 60 }, data: { oid: '0_userdata.0.demo.general.value' } },
        { id: 'low-rounded', label: { en: 'Low (rounded)', de: 'Low (rounded)' }, purpose: { en: '', de: '' }, size: { width: 300, height: 30 }, data: { oid: '0_userdata.0.demo.climate.living.humidity', min: 0, max: 100, valueLabelUnit: '%', colorProgress: '#43a047', textAlign: 'center' } },
        { id: 'medium', label: { en: 'Medium', de: 'Medium' }, purpose: { en: '', de: '' }, size: { width: 300, height: 30 }, data: { oid: '0_userdata.0.demo.energy.today', min: 0, max: 100, valueLabelUnit: '%', colorProgress: '#43a047', textAlign: 'center' } },
        { id: 'high', label: { en: 'High', de: 'High' }, purpose: { en: '', de: '' }, size: { width: 300, height: 30 }, data: { oid: '0_userdata.0.demo.energy.pv', min: 0, max: 100, valueLabelUnit: '%', colorProgress: '#43a047', textAlign: 'center' } },
        { id: 'square', label: { en: 'Square', de: 'Square' }, purpose: { en: '', de: '' }, size: { width: 300, height: 30 }, data: { oid: '0_userdata.0.demo.energy.today', min: 0, max: 100, showValueLabel: false, valueLabelUnit: '%', colorProgress: '#43a047', progressRounded: false, textAlign: 'center' } },
        { id: 'striped', label: { en: 'Striped', de: 'Striped' }, purpose: { en: '', de: '' }, size: { width: 300, height: 30 }, data: { oid: '0_userdata.0.demo.energy.today', min: 0, max: 100, valueLabelUnit: '%', colorProgress: '#43a047', textAlign: 'center', progressStriped: true } },
        { id: 'indeterminate', label: { en: 'Indeterminate', de: 'Indeterminate' }, purpose: { en: '', de: '' }, size: { width: 300, height: 30 }, data: { oid: '0_userdata.0.demo.energy.pv', min: 0, max: 100, valueLabelUnit: '%', colorProgress: '#43a047', textAlign: 'center', progressIndeterminate: true } },
    ],
    MaterialDesignProgressCircular: [
        { id: 'typical', label: { en: 'Typical', de: 'Typical' }, purpose: { en: '', de: '' }, size: { width: 300, height: 60 }, data: { oid: '0_userdata.0.demo.general.value' } },
        { id: 'circular-determinate', label: { en: 'Circular determinate', de: 'Circular determinate' }, purpose: { en: '', de: '' }, size: { width: 110, height: 110 }, data: { oid: '0_userdata.0.demo.energy.today', min: 0, max: 100, valueLabelUnit: '%', colorProgress: '#43a047' } },
        { id: 'circular-thick', label: { en: 'Circular thick', de: 'Circular thick' }, purpose: { en: '', de: '' }, size: { width: 110, height: 110 }, data: { oid: '0_userdata.0.demo.energy.pv', min: 0, max: 100, valueLabelUnit: '%', colorProgress: '#43a047', progressCircularWidth: 12 } },
        { id: 'circular-indeterminate', label: { en: 'Circular indeterminate', de: 'Circular indeterminate' }, purpose: { en: '', de: '' }, size: { width: 110, height: 110 }, data: { oid: '0_userdata.0.demo.energy.pv', min: 0, max: 100, showValueLabel: false, valueLabelUnit: '%', colorProgress: '#43a047', progressIndeterminate: true } },
    ],
};
