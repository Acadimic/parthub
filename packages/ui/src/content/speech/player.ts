import {
  cancelDeviceSpeech,
  findDeviceVoice,
  findDeviceVoiceNow,
  speakWithDevice,
  unlockDeviceSpeech,
} from './device-voice';

export type SpeechStatus = 'idle' | 'loading' | 'playing';

/** Normal speed, and the slow one. Below about 0.6 several device voices start to sound broken. */
export const SPEECH_RATES = { normal: 1, slow: 0.7 } as const;

export interface ISpeechRequest {
  /** Which control asked, so that control alone shows itself playing. */
  id: string;
  /** Spoken one after another; a listening block passes one per paragraph so it can highlight it. */
  segments: string[];
  lang: string;
  /** A stored file to play instead of the device voice, or `''`. */
  audio: string;
  rate: number;
  /** Turns a stored address into a playable URL — the host app's signer. */
  resolveUrl: (src: string) => Promise<string>;
}

export interface ISpeechState {
  activeId: string;
  status: SpeechStatus;
  /** The segment being spoken, or -1 while a file plays (a file has no per-segment timing). */
  segment: number;
}

const IDLE: ISpeechState = { activeId: '', status: 'idle', segment: -1 };

let state: ISpeechState = IDLE;
let audioElement: HTMLAudioElement | null = null;
/** Bumped on every play and stop, so a playback that was superseded notices and goes quiet. */
let generation = 0;
const listeners = new Set<() => void>();

const setState = (next: ISpeechState) => {
  state = next;
  listeners.forEach((listener) => listener());
};

export const subscribeSpeech = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getSpeechState = (): ISpeechState => state;
export const getIdleSpeechState = (): ISpeechState => IDLE;

const silence = () => {
  cancelDeviceSpeech();
  audioElement?.pause();
  audioElement = null;
};

/** Stops whatever is playing. */
export const stopSpeech = () => {
  generation += 1;
  silence();
  setState(IDLE);
};

/** A few silent samples: played inside the tap, they unlock the element for the real file on iOS. */
const SILENCE = 'data:audio/wav;base64,UklGRiwAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQgAAACAgICAgICAgA==';

/**
 * Plays a stored file on `audio`, an element already started inside the tap (the address is signed
 * first, and Safari blocks a play() that starts after an await). Resolves false when it could not
 * be loaded, so the caller can fall back.
 */
const playFile = async (
  request: ISpeechRequest,
  audio: HTMLAudioElement,
  isCurrent: () => boolean,
): Promise<boolean> => {
  const url = await request.resolveUrl(request.audio).catch(() => '');
  if (!url || !isCurrent()) return false;
  audio.src = url;
  audio.playbackRate = request.rate;
  audio.preservesPitch = true;
  audioElement = audio;
  return new Promise((resolve) => {
    audio.onended = () => resolve(true);
    audio.onerror = () => resolve(false);
    audio.onplaying = () => isCurrent() && setState({ activeId: request.id, status: 'playing', segment: -1 });
    audio.play().catch(() => resolve(false));
  });
};

/**
 * What must happen inside the tap, before any await (phone browsers block playback that starts
 * later): a file gets its element started on silence; the device voice is looked up without
 * waiting, and speech is unlocked if the voices are still loading.
 */
const startInTap = (request: ISpeechRequest) => {
  if (request.audio) {
    const element = new Audio(SILENCE);
    element.play().catch(() => undefined);
    return { element, voice: null };
  }
  const voice = findDeviceVoiceNow(request.lang);
  if (voice === null) unlockDeviceSpeech();
  return { element: null, voice };
};

/**
 * Plays one request, stopping anything already playing: there is one speaker. A stored file comes
 * first, then the device voice. Resolves `false` when neither could play — no file and no voice
 * for the language on this device.
 */
export const playSpeech = async (request: ISpeechRequest): Promise<boolean> => {
  stopSpeech();
  const current = generation;
  const isCurrent = () => current === generation;
  setState({ activeId: request.id, status: 'loading', segment: 0 });

  const { element, voice: ready } = startInTap(request);

  if (element && (await playFile(request, element, isCurrent))) {
    if (isCurrent()) setState(IDLE);
    return true;
  }
  if (!isCurrent()) return true;

  const voice = ready ?? (await findDeviceVoice(request.lang));
  if (!voice || !isCurrent()) {
    if (isCurrent()) setState(IDLE);
    return Boolean(voice);
  }
  for (let index = 0; index < request.segments.length && isCurrent(); index += 1) {
    setState({ activeId: request.id, status: 'playing', segment: index });
    await speakWithDevice(request.segments[index], voice, request.rate, isCurrent);
  }
  if (isCurrent()) setState(IDLE);
  return true;
};
