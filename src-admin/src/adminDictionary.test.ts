import { describe, expect, it } from 'vitest';
import { I18n } from '@iobroker/adapter-react-v5/build/i18n';

import de from '../../admin/i18n/de.json';
import { adminDictionary } from './adminDictionary';

describe('adminDictionary', () => {
    it('keeps every translation a string after I18n merged it for one language', () => {
        I18n.extendTranslations(adminDictionary(de), 'de');
        I18n.setLanguage('de');
        expect(I18n.t('group_columnLayout')).toBe(de.group_columnLayout);
        expect(Object.keys(de).filter(word => typeof I18n.t(word) !== 'string')).toEqual([]);
    });

    it('drops the reserved prefix key and leaves the other words alone', () => {
        expect(adminDictionary({ prefix: 'Präfix', suffix: 'Suffix' })).toEqual({ suffix: 'Suffix' });
        expect(adminDictionary({ prefix: 'Präfix' })).toEqual({});
        expect(adminDictionary({})).toEqual({});
    });

    it('does not change the dictionary it was given', () => {
        const source = { prefix: 'Präfix', suffix: 'Suffix' };
        adminDictionary(source);
        expect(source).toEqual({ prefix: 'Präfix', suffix: 'Suffix' });
    });
});
