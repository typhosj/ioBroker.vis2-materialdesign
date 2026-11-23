import adminEn from '../../../admin/i18n/en.json';
import galleryEn from '../i18n/en.json';

export type Lang = 'en' | 'de';
export const LANGS: readonly Lang[] = ['en', 'de'];

type Dictionary = Record<string, string>;
const english: Dictionary = { ...adminEn, ...galleryEn };
let dictionary: Dictionary = english;
let lang: Lang = 'en';

export function parseLang(value: unknown): Lang {
    return value === 'de' ? 'de' : 'en';
}

export async function loadLanguage(next: Lang): Promise<void> {
    if (next === 'de') {
        const [admin, gallery] = await Promise.all([import('../../../admin/i18n/de.json'), import('../i18n/de.json')]);
        dictionary = { ...admin.default, ...gallery.default };
    } else {
        dictionary = english;
    }
    lang = next;
}

export function currentLang(): Lang {
    return lang;
}

export function translate(key: string, ...args: unknown[]): string {
    let text = dictionary[key] ?? english[key] ?? key;
    for (const arg of args) text = text.replace('%s', String(arg));
    return text;
}
