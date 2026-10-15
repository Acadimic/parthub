import { MicrophoneIcon, MicrophoneStageIcon, PlayIcon, SpeakerHighIcon, StopIcon } from '@phosphor-icons/react';
import { type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { cn } from '../../lib/cn';
import { SPEECH_RATES } from '../speech/player';
import { useSpeech } from '../speech/use-speech';
import { ActivityFrame, type ISpoken, OUTLINE_PILL, PRIMARY_PILL } from './ActivityFrame';

export interface ISayLine {
  content: ReactNode;
  /** The line as plain text, shown when it is pronounced. */
  label: string;
  spoken: ISpoken | null;
}

type RecorderState = 'idle' | 'asking' | 'recording' | 'denied';

const canRecord = () =>
  typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';

/**
 * Records the learner on this device only: nothing is uploaded or kept after the page closes. Each
 * line keeps its last take so the learner can play theirs straight after the model's.
 */
const useRecorder = () => {
  const [state, setState] = useState<RecorderState>('idle');
  const [takeUrl, setTakeUrl] = useState('');
  const recorder = useRef<MediaRecorder | null>(null);

  useEffect(
    () => () => {
      recorder.current?.stream.getTracks().forEach((track) => track.stop());
    },
    [],
  );
  useEffect(
    () => () => {
      if (takeUrl) URL.revokeObjectURL(takeUrl);
    },
    [takeUrl],
  );

  const start = async () => {
    setState('asking');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const media = new MediaRecorder(stream);
      media.ondataavailable = (event) => chunks.push(event.data);
      media.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        setTakeUrl(URL.createObjectURL(new Blob(chunks, { type: media.mimeType })));
        setState('idle');
      };
      recorder.current = media;
      media.start();
      setState('recording');
    } catch {
      setState('denied');
    }
  };
  const stop = () => recorder.current?.state === 'recording' && recorder.current.stop();
  return { state, takeUrl, start, stop };
};

const recordLabel = (state: RecorderState, hasTake: boolean): string => {
  if (state === 'recording') return 'Stop';
  return hasTake ? 'Record again' : 'Record';
};

const SayLine = ({ line, isRecordable }: { line: ISayLine; isRecordable: boolean }) => {
  const id = useId();
  const model = useSpeech(id);
  const { state, takeUrl, start, stop } = useRecorder();
  const [isPlayingMine, setIsPlayingMine] = useState(false);
  const isModelBusy = model.status !== 'idle';
  const { spoken } = line;

  const playMine = () => {
    if (!takeUrl) return;
    model.stop();
    const audio = new Audio(takeUrl);
    setIsPlayingMine(true);
    audio.onended = () => setIsPlayingMine(false);
    audio.play().catch(() => setIsPlayingMine(false));
  };

  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1 [&_p]:my-0">
        {spoken ? (
          // Plain text: the Listen button beside it already plays the line.
          <span className="flex flex-col">
            <span lang={spoken.pronunciation.lang} className="text-lg">
              {line.label}
            </span>
            {spoken.pronunciation.translit && line.label === spoken.text ? (
              <span className="text-xs italic text-muted-foreground">{spoken.pronunciation.translit}</span>
            ) : null}
          </span>
        ) : (
          <span className="text-lg">{line.content}</span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5 print:hidden">
        {spoken ? (
          <button
            type="button"
            onClick={() =>
              isModelBusy
                ? model.stop()
                : model.play({
                    segments: [spoken.text],
                    lang: spoken.pronunciation.lang,
                    audio: spoken.pronunciation.audio,
                    rate: SPEECH_RATES.normal,
                  })
            }
            className={OUTLINE_PILL}
          >
            {isModelBusy ? (
              <StopIcon className="h-3.5 w-3.5" weight="fill" />
            ) : (
              <SpeakerHighIcon className="h-3.5 w-3.5" weight="bold" />
            )}
            Listen
          </button>
        ) : null}
        {isRecordable ? (
          <button
            type="button"
            onClick={() => (state === 'recording' ? stop() : start())}
            disabled={state === 'asking'}
            className={cn(state === 'recording' ? cn(PRIMARY_PILL, 'animate-pulse') : PRIMARY_PILL)}
          >
            {state === 'recording' ? (
              <StopIcon className="h-3.5 w-3.5" weight="fill" />
            ) : (
              <MicrophoneIcon className="h-3.5 w-3.5" weight="bold" />
            )}
            {recordLabel(state, !!takeUrl)}
          </button>
        ) : null}
        {takeUrl ? (
          <button type="button" onClick={playMine} disabled={isPlayingMine} className={OUTLINE_PILL}>
            <PlayIcon className="h-3.5 w-3.5" weight="fill" />
            My voice
          </button>
        ) : null}
        {state === 'denied' ? (
          <span className="text-xs text-muted-foreground">Allow the microphone to record.</span>
        ) : null}
      </div>
    </li>
  );
};

/**
 * Lines to say aloud. Listen to the model, record yourself, play your take, compare, retry. There is
 * no score: the learner's ear is the judge, which is honest about what the device can tell.
 */
export const SayItBlock = ({ lines }: { lines: ISayLine[] }) => {
  const [isRecordable, setIsRecordable] = useState(false);
  // Known only in the browser, so the first render matches the server's.
  useEffect(() => setIsRecordable(canRecord()), []);
  return (
    <ActivityFrame icon={MicrophoneStageIcon} title="Say it">
      <p className="mb-1 text-xs text-muted-foreground print:hidden">
        Listen, record yourself, then play your voice and compare. Your recording stays on this device.
      </p>
      <ul className="m-0 list-none divide-y divide-border/60 p-0">
        {lines.map((line, index) => (
          <SayLine key={index} line={line} isRecordable={isRecordable} />
        ))}
      </ul>
    </ActivityFrame>
  );
};
