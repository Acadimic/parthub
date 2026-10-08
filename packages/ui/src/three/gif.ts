import type { Encoder } from 'modern-gif';
import type { IFrameRecording, Stage } from './stage';
import { drawFrame, type IFrameOptions } from './snapshot';

/** One full turn in 60 frames at 70 ms: about four seconds, smooth enough to read the shape. */
const FRAMES = 60;
const FRAME_DELAY_MS = 70;
/** A GIF's width in pixels, whatever the screen: a shareable file size. */
const GIF_WIDTH = 640;
/** Text never shrinks below this multiplier, so axis labels stay legible in a narrower GIF. */
const MIN_TEXT_SCALE = 0.9;
/** The share of the progress bar given to recording frames; encoding the file takes the rest. */
export const GIF_RECORDING_SHARE = 0.9;

/** The scale a GIF of a view `cssWidth` pixels wide is drawn at, and the text scale beside it. */
export const gifFrameScale = (cssWidth: number): Pick<IFrameOptions, 'scale' | 'textScale'> => {
  const scale = Math.min(1, GIF_WIDTH / Math.max(cssWidth, 1));
  return { scale, textScale: Math.max(scale, MIN_TEXT_SCALE) };
};

/**
 * Gives the browser a turn between frames. Encoding a frame resolves without ever leaving the
 * current task, so without this the whole recording runs as one long task: the page freezes, the
 * progress panel never repaints, and a second recording looks as though the button did nothing.
 */
const yieldToBrowser = (): Promise<void> => new Promise((resolve) => window.setTimeout(resolve, 0));

/**
 * Every frame of a GIF must be the size of the first. The popup can change size mid-recording (the
 * full-screen toggle stays live), so a frame that comes out a different size is scaled to fit.
 */
const fitFrame = (canvas: HTMLCanvasElement, width: number, height: number): HTMLCanvasElement => {
  if (canvas.width === width && canvas.height === height) return canvas;
  const fitted = document.createElement('canvas');
  fitted.width = width;
  fitted.height = height;
  fitted.getContext('2d')?.drawImage(canvas, 0, 0, width, height);
  return fitted;
};

/** The content turning once round: how a graph, or a scene without steps, is recorded. */
export const turnRecording = (stage: Stage): IFrameRecording => ({
  count: FRAMES,
  delay: () => FRAME_DELAY_MS,
  capture: (onFrame) => stage.captureTurn(FRAMES, onFrame),
});

/**
 * Records `recording` and encodes it as a looping GIF. `modern-gif` is loaded here, on the first GIF
 * download, never with the page. `onProgress` receives a fraction from 0 to 1. Null when there is
 * nothing to save, including when the content is closed mid-recording: a part of a recording is not
 * offered as a download.
 */
export const recordGif = async (
  recording: IFrameRecording,
  frame: IFrameOptions,
  onProgress: (fraction: number) => void,
): Promise<Blob | null> => {
  const { Encoder: GifEncoder } = await import('modern-gif');
  // Held in an object: the encoder is created inside the frame callback, which the compiler cannot
  // follow into, so a plain `let` would read as always null after it.
  const state: { encoder: Encoder | null; width: number; height: number } = { encoder: null, width: 0, height: 0 };
  const isComplete = await recording.capture(async (source, labels, index) => {
    // Drawn before the first await, while the WebGL buffer still holds this frame.
    const drawn = drawFrame(source, labels, frame);
    if (!drawn) return;
    if (!state.encoder) {
      state.width = drawn.width;
      state.height = drawn.height;
    }
    const canvas = fitFrame(drawn, state.width, state.height);
    state.encoder ??= new GifEncoder({
      width: state.width,
      height: state.height,
      maxColors: 255,
      // A GIF holds 255 colours; dithering hides the steps that leaves in a surface's smooth shading.
      dither: 'floyd-steinberg',
      looped: true,
      loopCount: 0,
    });
    await state.encoder.encode({ data: canvas, delay: recording.delay(index) });
    onProgress(((index + 1) / recording.count) * GIF_RECORDING_SHARE);
    await yieldToBrowser();
  });
  if (!state.encoder || !isComplete) return null;
  // One more turn, so "Making the GIF…" is on screen before the final encode holds the page.
  await yieldToBrowser();
  const blob = await state.encoder.flush('blob');
  onProgress(1);
  return blob;
};
