import type { IRichTextMark, RichTextAttrValue } from '../interfaces/rich-text.interface';

/**
 * Pronunciation in authored content: a `pronunciation` mark on a word, phrase or sentence, and a
 * `listening` block around a passage or a dialogue. Both carry a BCP-47 `lang`; the reader picks a
 * voice for it, or plays `audio` when one was stored. See `.claude/plans/PRONUNCIATION.md`.
 */
export const PRONUNCIATION_MARK = 'pronunciation';
export const LISTENING_NODE = 'listening';
export const LISTENING_MODES = ['passage', 'dialogue'] as const;
export type ListeningMode = (typeof LISTENING_MODES)[number];

/** The attributes the mark carries. Every one is a string, empty when absent. */
export interface IPronunciationAttrs {
  lang: string;
  ipa: string;
  translit: string;
  /** A stored bucket address, or `''` for the device voice. */
  audio: string;
}

export interface IListeningAttrs {
  lang: string;
  mode: ListeningMode;
  audio: string;
}

export interface ISpeechLanguage {
  /** BCP-47, as stored on the mark. */
  code: string;
  name: string;
  nativeName: string;
  /** Whether the script is not Latin, so a transliteration helps a learner. */
  isNonLatin: boolean;
  /** Device voices to try, in order. Sanskrit has almost none, so a Hindi voice reads its Devanagari. */
  speechLocales: string[];
}

/** Every language content can be marked in. The one place a language code is named. */
export const SPEECH_LANGUAGES: ISpeechLanguage[] = [
  { code: 'en-US', name: 'English (US)', nativeName: 'English', isNonLatin: false, speechLocales: ['en-US', 'en'] },
  { code: 'en-GB', name: 'English (UK)', nativeName: 'English', isNonLatin: false, speechLocales: ['en-GB', 'en'] },
  { code: 'es-ES', name: 'Spanish (Spain)', nativeName: 'Español', isNonLatin: false, speechLocales: ['es-ES', 'es'] },
  {
    code: 'es-MX',
    name: 'Spanish (Latin America)',
    nativeName: 'Español',
    isNonLatin: false,
    speechLocales: ['es-MX', 'es-US', 'es'],
  },
  { code: 'fr-FR', name: 'French', nativeName: 'Français', isNonLatin: false, speechLocales: ['fr-FR', 'fr'] },
  { code: 'de-DE', name: 'German', nativeName: 'Deutsch', isNonLatin: false, speechLocales: ['de-DE', 'de'] },
  { code: 'it-IT', name: 'Italian', nativeName: 'Italiano', isNonLatin: false, speechLocales: ['it-IT', 'it'] },
  { code: 'pt-BR', name: 'Portuguese', nativeName: 'Português', isNonLatin: false, speechLocales: ['pt-BR', 'pt'] },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', isNonLatin: true, speechLocales: ['hi-IN', 'hi'] },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', isNonLatin: true, speechLocales: ['sa-IN', 'sa', 'hi-IN'] },
  { code: 'ja-JP', name: 'Japanese', nativeName: '日本語', isNonLatin: true, speechLocales: ['ja-JP', 'ja'] },
  { code: 'zh-CN', name: 'Chinese (Mandarin)', nativeName: '中文', isNonLatin: true, speechLocales: ['zh-CN', 'zh'] },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', isNonLatin: true, speechLocales: ['ar-SA', 'ar'] },
];

/** The language for a code, or `undefined` for one the registry does not know. */
export const findSpeechLanguage = (code: string): ISpeechLanguage | undefined =>
  SPEECH_LANGUAGES.find((language) => language.code.toLowerCase() === code.toLowerCase());

/** A readable name for a code, falling back to the code itself so an unknown one still shows. */
export const speechLanguageName = (code: string): string => findSpeechLanguage(code)?.name ?? code;

const stringOf = (value: RichTextAttrValue | undefined): string => (typeof value === 'string' ? value : '');

/** The mark's attributes with every field present. */
export const pronunciationAttrsOf = (mark: IRichTextMark): IPronunciationAttrs => ({
  lang: stringOf(mark.attrs?.lang),
  ipa: stringOf(mark.attrs?.ipa),
  translit: stringOf(mark.attrs?.translit),
  audio: stringOf(mark.attrs?.audio),
});

/** Two pronunciation marks are the same run when every attribute matches. */
export const isSamePronunciation = (a: IRichTextMark, b: IRichTextMark): boolean => {
  const left = pronunciationAttrsOf(a);
  const right = pronunciationAttrsOf(b);
  return (Object.keys(left) as (keyof IPronunciationAttrs)[]).every((key) => left[key] === right[key]);
};

// ---------------------------------------------------------------------------
// Markdown: Pandoc's bracketed span `[Hola]{lang=es-ES ipa="ˈola"}` and fenced div `::: listening`.
// ---------------------------------------------------------------------------

/** `key=value` or `key="value with spaces"`; a quote inside a quoted value is escaped. */
const ATTR_PATTERN = /([a-zA-Z]+)=(?:"((?:[^"\\]|\\.)*)"|([^\s"]+))/;

/** Reads `lang=es-ES ipa="ˈola"` into a map. Unknown keys are kept; the caller picks what it needs. */
export const parseMarkdownAttrs = (source: string): Record<string, string> => {
  const attrs: Record<string, string> = {};
  const pattern = new RegExp(ATTR_PATTERN.source, 'g');
  for (let match = pattern.exec(source); match; match = pattern.exec(source)) {
    attrs[match[1]] = match[2] !== undefined ? match[2].replace(/\\"/g, '"') : match[3];
  }
  return attrs;
};

/** Writes attributes in the order given, skipping empty ones, quoting a value that needs it. */
export const formatMarkdownAttrs = (entries: [string, string][]): string =>
  entries
    .filter(([, value]) => value)
    .map(([key, value]) => (/^[^\s"{}]+$/.test(value) ? `${key}=${value}` : `${key}="${value.replace(/"/g, '\\"')}"`))
    .join(' ');

/** IPA is stored without its slashes; the reader draws them. A model often writes them anyway. */
export const stripIpaSlashes = (ipa: string): string => ipa.trim().replace(/^[/[]|[/\]]$/g, '');

/** The mark a parsed span becomes, every attribute present so editor and reader see one shape. */
export const pronunciationMarkFrom = (attrs: Record<string, string>): IRichTextMark => ({
  type: PRONUNCIATION_MARK,
  attrs: {
    lang: attrs.lang ?? '',
    ipa: stripIpaSlashes(attrs.ipa ?? ''),
    translit: attrs.translit ?? '',
    audio: '',
  },
});
