import { findSpeechLanguage, speechLanguageName } from '../utils/pronunciation.util';
import { type IAiIssue } from './common';

/**
 * What the prompts tell a model about pronunciation, for a language course only — `locale` is the
 * standard's spoken language. A physics prompt passes nothing and gets nothing. Whether a marked
 * item later gets a generated audio file is decided after import, never by the model.
 */
export const pronunciationRules = (locale: string | null | undefined): string => {
  if (!locale) return '';
  const language = speechLanguageName(locale);
  const translit = findSpeechLanguage(locale)?.isNonLatin
    ? ' and translit="…" (its romanisation in Latin letters)'
    : '';
  return `

# Pronunciation

This is a ${language} course. Mark what a learner should hear, so the reader can play it:
- Every new vocabulary item, set phrase and example sentence in ${language} is a span: [word]{lang=${locale} ipa="…"} — in a Spanish course, for example, [Hola]{lang=es-ES ipa="ˈola"}. Give ipa="…" (IPA, without slashes) for words and short phrases${translit}. Sentences need lang only.
- Mark a word once where it is taught (its vocabulary table row or first use), not every time it reappears.
- A dialogue or a reading passage is a listening block, on lines of their own:
  ::: listening lang=${locale} mode=dialogue
  **Ana:** (her first line, in ${language})

  **Ravi:** (his reply)
  :::
  Use mode=dialogue for a conversation (one line per paragraph, each opening with the speaker's name in bold and a colon) and mode=passage for a text read aloud. Inside a block write paragraphs only — no headings, lists or tables.
- Never mark explanations, headings, grammar notes or translations, and never mark text in the language of instruction.
- Text in another language the course teaches alongside gets its own code, e.g. lang=en-US.
- Inside JSON strings the quotes around an attribute value are escaped: ipa=\\"ˈola\\"; a value with no spaces needs no quotes at all: ipa=ˈola.`;
};

const SPAN = /\[([^\]]+)\]\{([^}]*)\}/g;
const LISTENING_OPEN = /^:::\s*listening\b(.*)$/;
const DIV_LINE = /^:::/;

/**
 * Pronunciation problems a validator can see in Markdown. Warnings, because the import keeps the
 * text either way: a span without a language stays literal text, an unknown language still plays
 * if the device has a voice for it.
 */
export const checkPronunciation = (markdown: string, path: string, issues: IAiIssue[]) => {
  const text = markdown ?? '';
  const spans = new RegExp(SPAN.source, 'g');
  for (let match = spans.exec(text); match; match = spans.exec(text)) {
    const lang = /\blang=("?)([^\s"}]+)\1/.exec(match[2])?.[2];
    if (!lang) {
      issues.push({ level: 'warning', path, message: `"[${match[1]}]{…}" has no lang=, so it stays plain text.` });
    } else if (!findSpeechLanguage(lang)) {
      issues.push({ level: 'warning', path, message: `"${lang}" is not a known language code (on "${match[1]}").` });
    }
  }
  let isOpen = false;
  text.split('\n').forEach((raw) => {
    const line = raw.trim();
    if (!DIV_LINE.test(line)) return;
    const open = LISTENING_OPEN.exec(line);
    if (open && isOpen) {
      issues.push({
        level: 'warning',
        path,
        message: 'A listening block opens inside another; close each with ":::".',
      });
    }
    if (open && !/\blang=/.test(open[1])) {
      issues.push({ level: 'warning', path, message: 'A listening block has no lang=.' });
    }
    isOpen = !!open;
  });
  if (isOpen) {
    issues.push({ level: 'warning', path, message: 'A listening block is never closed with ":::"; it stays text.' });
  }
};
