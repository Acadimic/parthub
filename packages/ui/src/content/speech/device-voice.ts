import { findSpeechLanguage } from '@repo/shared/utils';

const hasSpeech = (): boolean => typeof window !== 'undefined' && 'speechSynthesis' in window;

let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;
/** The loaded list, once known, so a tap can find its voice without waiting. */
let loadedVoices: SpeechSynthesisVoice[] | null = null;

/**
 * The device's voices. Chrome returns none until `voiceschanged` fires, and some browsers never
 * fire it, so the wait is bounded and an empty list is a real answer.
 */
const loadVoices = (): Promise<SpeechSynthesisVoice[]> => {
  if (!hasSpeech()) return Promise.resolve([]);
  if (voicesPromise) return voicesPromise;
  voicesPromise = new Promise((resolve) => {
    const ready = window.speechSynthesis.getVoices();
    if (ready.length) {
      loadedVoices = ready;
      resolve(ready);
      return;
    }
    const finish = () => {
      const voices = window.speechSynthesis.getVoices();
      // Phones often list their voices later than the wait; an empty answer is not kept, so the next
      // call asks again, and a late voiceschanged (below) fills the list in.
      if (voices.length) loadedVoices = voices;
      else voicesPromise = null;
      resolve(voices);
    };
    window.speechSynthesis.addEventListener('voiceschanged', finish, { once: true });
    window.setTimeout(finish, 1500);
  });
  return voicesPromise;
};

/** Calls `listener` whenever the device's voice list changes; returns the unsubscribe. */
export const onDeviceVoicesChanged = (listener: () => void): (() => void) => {
  if (!hasSpeech()) return () => undefined;
  const handle = () => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length) {
      loadedVoices = voices;
      voicesPromise = Promise.resolve(voices);
    }
    listener();
  };
  window.speechSynthesis.addEventListener('voiceschanged', handle);
  return () => window.speechSynthesis.removeEventListener('voiceschanged', handle);
};

const normalise = (locale: string): string => locale.replace('_', '-').toLowerCase();

/** Network and "enhanced" voices sound far better than the compact defaults most devices list first. */
const QUALITY_HINTS = /natural|neural|enhanced|premium|google|siri/i;

const pickBest = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined =>
  voices.find((voice) => QUALITY_HINTS.test(voice.name)) ?? voices[0];

/**
 * The best device voice for a language, or `undefined` when there is none. Each of the language's
 * locales is tried in order, an exact match before a language-only one, so `es-ES` prefers a voice
 * from Spain and falls back to any Spanish voice.
 */
export const findDeviceVoice = async (lang: string): Promise<SpeechSynthesisVoice | undefined> =>
  matchVoice(await loadVoices(), lang);

/**
 * The same answer without waiting, or `null` while the voices are still loading. Phone browsers,
 * Safari above all, only let a tap start speech synchronously, so a click must not await first.
 */
export const findDeviceVoiceNow = (lang: string): SpeechSynthesisVoice | undefined | null =>
  loadedVoices ? matchVoice(loadedVoices, lang) : null;

/**
 * Speaks nothing, inside the tap: on iOS the first utterance must come from a user gesture, and once
 * one has, later ones (after the voices load) are allowed.
 */
export const unlockDeviceSpeech = () => {
  if (hasSpeech()) window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
};

const matchVoice = (voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | undefined => {
  const locales = findSpeechLanguage(lang)?.speechLocales ?? [lang];
  for (const locale of locales.map(normalise)) {
    const exact = voices.filter((voice) => normalise(voice.lang) === locale);
    if (exact.length) return pickBest(exact);
    const prefix = voices.filter((voice) => normalise(voice.lang).split('-')[0] === locale.split('-')[0]);
    if (!locale.includes('-') && prefix.length) return pickBest(prefix);
  }
  return undefined;
};

/** Chrome cuts an utterance off after about fifteen seconds, so long text is spoken a sentence at a time. */
const splitSentences = (text: string): string[] =>
  text
    .split(/(?<=[.!?।॥。！？])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

const speakOne = (text: string, voice: SpeechSynthesisVoice, rate: number): Promise<void> =>
  new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = rate;
    // A cancelled utterance reports an error; either way this one is finished.
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });

/** Speaks `text` sentence by sentence; `isCurrent` stops the queue once something else has started. */
export const speakWithDevice = async (
  text: string,
  voice: SpeechSynthesisVoice,
  rate: number,
  isCurrent: () => boolean,
): Promise<void> => {
  for (const sentence of splitSentences(text)) {
    if (!isCurrent()) return;
    await speakOne(sentence, voice, rate);
  }
};

// Only when something is queued: Chrome on Android can drop an utterance spoken right after cancel().
export const cancelDeviceSpeech = () => {
  if (hasSpeech() && (window.speechSynthesis.speaking || window.speechSynthesis.pending)) {
    window.speechSynthesis.cancel();
  }
};
