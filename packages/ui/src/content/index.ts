// The read-only half of authored content: what a student downloads. KaTeX only — no ProseMirror,
// no MathLive; three.js arrives as its own chunk when a 3D graph is opened. The authoring half is `@repo/ui/editor`, which imports from here and never the
// reverse.
export { MathRender, renderLatex } from './MathRender';
export type { IMathRenderProps } from './MathRender';
export { RichTextView } from './RichTextView';
export { GraphButton, GraphModal, GRAPH_MODAL_ID, preloadGraphViewer } from './GraphButton';
export type { IGraphButtonProps, IGraphModalProps } from './GraphButton';
export type { IRichTextViewProps } from './RichTextView';
export { RichTextImage, useResolvedImageUrl, IMAGE_WIDTH_CLASSES } from './RichTextImage';
export type { IRichTextImageProps } from './RichTextImage';
export { PronouncedText } from './PronouncedText';
export type { IPronouncedTextProps } from './PronouncedText';
export { ListeningBlock } from './ListeningBlock';
export type { IListeningBlockProps } from './ListeningBlock';
export { playSpeech, stopSpeech, SPEECH_RATES } from './speech/player';
export type { ISpeechRequest, SpeechStatus } from './speech/player';
export { useSpeech, useVoiceAvailability } from './speech/use-speech';
export type { IUseSpeech, VoiceAvailability } from './speech/use-speech';
