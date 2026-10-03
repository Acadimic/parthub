import { findSpeechLanguage, speechLanguageName } from '../utils/pronunciation.util';
import { type IAiIssue } from './common';

/**
 * What the prompts tell a model about pronunciation, for a language course only — `locale` is the
 * standard's spoken language. A physics prompt passes nothing and gets nothing. Whether a marked
 * item later gets a generated audio file is decided after import, never by the model.
 */
export const pronunciationRules = (locale: string | null | undefined): string => {
  if (!locale) return '';
  // "Spanish", not "Spanish (Spain)": the variant is in the code, and the name reads in a sentence.
  const language = speechLanguageName(locale).replace(/\s*\(.*\)$/, '');
  const translit = findSpeechLanguage(locale)?.isNonLatin
    ? ' and translit="…" (its romanisation in Latin letters)'
    : '';
  return `

# Pronunciation

This is a ${language} course. Mark every piece of correct ${language} the learner reads, in every section, so they can hear anything they see:
- A word, phrase or sentence in ${language} is a span: [word]{lang=${locale} ipa="…"} — in a Spanish course, for example, [Hola]{lang=es-ES ipa="ˈola"}. Give ipa="…" (IPA, without slashes) where a word or short phrase is taught and in the Key terms list${translit}; everywhere else, and for sentences, lang only.
- That includes the exercises, the answers (write each answer as the full correct sentence and mark it), the correct version in "Common mistakes", the important notes, the key terms (- [**term**]{lang=${locale} ipa="…"} — meaning) and the summary.
- Never mark an item with a blank (____), a choice between forms, a deliberate mistake to correct, a jumble to reorder, or a wrong form.
- In a test question, mark the Spanish of the body and the solution. Mark the options only when every option is correct ${language} (a meaning or a reply to choose), and then mark all of them; never mark some options and not others, which would point at the answer, and never mark options whose sound gives the answer away (spelling, accents, stress).
- A listening question puts what the learner hears in a listening block with transcript=hidden (::: listening lang=${locale} mode=dialogue transcript=hidden), and asks about it in the language of instruction; the learner plays it, answers, and can reveal the text afterwards.
- A dialogue or a reading passage is a listening block, on lines of their own:
  ::: listening lang=${locale} mode=dialogue
  **Ana:** (her first line, in ${language})

  **Ravi:** (his reply)
  :::
  Use mode=dialogue for a conversation (one line per paragraph, each opening with the speaker's name in bold and a colon) and mode=passage for a text read aloud. Inside a block write paragraphs only — no headings, lists or tables.
- Never mark headings, explanations or translations, and never mark text in the language of instruction.
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
