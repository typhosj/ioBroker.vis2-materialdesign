import { afterEach, describe, expect, it } from 'vitest';

import adminDe from '../../../admin/i18n/de.json';
import adminEn from '../../../admin/i18n/en.json';
import galleryDe from '../i18n/de.json';
import galleryEn from '../i18n/en.json';
import { currentLang, loadLanguage, parseLang, translate } from './i18n';

afterEach(async () => { await loadLanguage('en'); });

describe('i18n', () => {
    it('parses only en and de, everything else is en', () => {
        expect(parseLang('de')).toBe('de');
        for (const value of ['en', 'fr', '', null, 3]) expect(parseLang(value)).toBe('en');
    });

    it('translates widget keys from admin/i18n and gallery keys from gallery/src/i18n', async () => {
        const key = Object.keys(adminDe).find(k => (adminDe as Record<string, string>)[k] !== (adminEn as Record<string, string>)[k])!;
        expect(translate(key)).toBe((adminEn as Record<string, string>)[key]);
        await loadLanguage('de');
        expect(currentLang()).toBe('de');
        expect(translate(key)).toBe((adminDe as Record<string, string>)[key]);
        expect(translate('gallery_reset')).toBe(galleryDe.gallery_reset);
    });

    it('falls back to the key and replaces %s in order', () => {
        expect(translate('no_such_key')).toBe('no_such_key');
        expect(translate('gallery_navigate', 'kitchen')).toBe('Would switch to view “kitchen”');
    });

    it('keeps both gallery dictionaries on the same key set without collisions', () => {
        expect(Object.keys(galleryDe).sort()).toEqual(Object.keys(galleryEn).sort());
        expect(Object.keys(galleryEn).filter(k => k in adminEn)).toEqual([]);
        expect(Object.keys(galleryEn).every(k => k.startsWith('gallery_'))).toBe(true);
    });
});
