import { SpeakerHighIcon, TrashIcon } from '@phosphor-icons/react';
import type { Editor } from '@tiptap/react';
import { findSpeechLanguage, type IPronunciationAttrs } from '@repo/shared/utils';
import { cn } from '../../lib/cn';
import { LanguagePicker } from '../pronunciation/LanguagePicker';
import { PreviewButtons } from '../pronunciation/PreviewButtons';
import { ToolbarButton, ToolbarGroup } from './ToolbarButton';

interface IProps {
  editor: Editor;
  attrs: IPronunciationAttrs;
  /** The run's text, for the preview. */
  text: string;
}

const FIELD_CLASS =
  'h-7 min-w-0 border border-border bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary';

/**
 * The settings of the pronounced run the caret is in, as a second toolbar row — the same place the
 * table controls appear — so marking a word never opens a dialog. Transliteration is offered for
 * non-Latin scripts, or wherever one was already written.
 */
export const PronunciationToolbar = ({ editor, attrs, text }: IProps) => {
  const update = (patch: Partial<IPronunciationAttrs>) => editor.commands.updatePronunciation(patch);
  const showTranslit = !!attrs.translit || !!findSpeechLanguage(attrs.lang)?.isNonLatin;

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 border-b border-border bg-primary/5 px-2 py-1"
      role="toolbar"
      aria-label="Pronunciation"
    >
      <span className="flex items-center gap-1 pr-0.5 text-xxs font-semibold uppercase tracking-caps text-primary">
        <SpeakerHighIcon className="h-3.5 w-3.5" weight="bold" />
        Pronounce
      </span>
      <LanguagePicker value={attrs.lang} onChange={(lang) => update({ lang })} />
      <label className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">IPA</span>
        <input
          value={attrs.ipa}
          onChange={(event) => update({ ipa: event.target.value.replace(/^\/|\/$/g, '') })}
          placeholder="ˈola"
          aria-label="IPA"
          className={cn(FIELD_CLASS, 'w-24')}
        />
      </label>
      {showTranslit ? (
        <label className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Romanised</span>
          <input
            value={attrs.translit}
            onChange={(event) => update({ translit: event.target.value })}
            placeholder="namaste"
            aria-label="Transliteration"
            className={cn(FIELD_CLASS, 'w-24')}
          />
        </label>
      ) : null}
      <PreviewButtons segments={[text]} lang={attrs.lang} audio={attrs.audio} />
      <ToolbarGroup label="Remove">
        <ToolbarButton
          label="Remove pronunciation"
          icon={<TrashIcon className="h-4 w-4" />}
          isDanger
          onClick={() => editor.chain().focus().unsetPronunciation().run()}
        />
      </ToolbarGroup>
    </div>
  );
};
