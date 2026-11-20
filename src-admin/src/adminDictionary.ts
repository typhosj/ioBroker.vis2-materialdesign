// `I18n.extendTranslations()` (adapter-react-v5 and gui-components) reads a top-level `prefix` word as
// "put this prefix in front of every word" and turns each translation into an object of single
// characters, which React then refuses to render (error #31, the config page stays blank). `prefix`
// is a widget attribute label the config page never shows, so it is left out of the dictionary the
// page hands over.
export function adminDictionary(words: Record<string, string>): Record<string, string> {
    const result = { ...words };
    delete result.prefix;
    return result;
}
