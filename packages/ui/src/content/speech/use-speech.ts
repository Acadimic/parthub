import { useEffect, useState, useSyncExternalStore } from 'react';
import { useRichTextMedia } from '../../contexts/rich-text-media-context';
import { findDeviceVoice } from './device-voice';
import {
  getIdleSpeechState,
  getSpeechState,
  type ISpeechRequest,
  playSpeech,
  type SpeechStatus,
  stopSpeech,
  subscribeSpeech,
} from './player';

export interface IUseSpeech {
  /** This control's status; another control playing reads as idle here. */
  status: SpeechStatus;
  /** The segment this control is speaking, or -1. */
  segment: number;
  play: (request: Omit<ISpeechRequest, 'id' | 'resolveUrl'>) => Promise<boolean>;
  stop: () => void;
}

/** One playable control's view of the shared player. `id` must be unique on the page. */
export const useSpeech = (id: string): IUseSpeech => {
  const { resolveMediaUrl } = useRichTextMedia();
  const state = useSyncExternalStore(subscribeSpeech, getSpeechState, getIdleSpeechState);
  const isMine = state.activeId === id;
  return {
    status: isMine ? state.status : 'idle',
    segment: isMine ? state.segment : -1,
    play: (request) => playSpeech({ ...request, id, resolveUrl: resolveMediaUrl }),
    stop: stopSpeech,
  };
};

export type VoiceAvailability = 'checking' | 'available' | 'unavailable';

/**
 * Whether this device can speak a language. A control with a stored file never needs to ask; one
 * without uses the answer to disable itself and say why, rather than doing nothing on a click.
 */
export const useVoiceAvailability = (lang: string, hasAudio: boolean): VoiceAvailability => {
  const [availability, setAvailability] = useState<VoiceAvailability>(hasAudio ? 'available' : 'checking');
  useEffect(() => {
    if (hasAudio) {
      setAvailability('available');
      return undefined;
    }
    let isCurrent = true;
    findDeviceVoice(lang).then((voice) => isCurrent && setAvailability(voice ? 'available' : 'unavailable'));
    return () => {
      isCurrent = false;
    };
  }, [lang, hasAudio]);
  return availability;
};
