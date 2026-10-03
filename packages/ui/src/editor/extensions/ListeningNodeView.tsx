import { ChatsCircleIcon, EyeIcon, EyeSlashIcon, HeadphonesIcon, TextTIcon } from '@phosphor-icons/react';
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { LISTENING_MODES, type ListeningMode } from '@repo/shared/utils';
import { cn } from '../../lib/cn';
import { LanguagePicker } from '../pronunciation/LanguagePicker';
import { PreviewButtons } from '../pronunciation/PreviewButtons';
import { CONTROL_CLASS, keepSelection } from '../toolbar/ToolbarButton';

const MODE_LABELS: Record<ListeningMode, string> = { passage: 'Passage', dialogue: 'Dialogue' };

/**
 * A listening block as the author sees it: the same card the reader shows, with its settings in
 * the header — passage or dialogue, the language, a preview, and a way back to plain paragraphs.
 * The paragraphs below stay ordinary editable text.
 */
export const ListeningNodeView = ({ node, updateAttributes, editor, getPos }: NodeViewProps) => {
  const lang = String(node.attrs.lang ?? '');
  const mode: ListeningMode = node.attrs.mode === 'dialogue' ? 'dialogue' : 'passage';
  const audio = String(node.attrs.audio ?? '');
  const isHidden = node.attrs.transcript === 'hidden';
  const isDialogue = mode === 'dialogue';
  const Icon = isDialogue ? ChatsCircleIcon : HeadphonesIcon;
  const segments: string[] = [];
  node.forEach((child) => segments.push(child.textContent));

  const unwrap = () => {
    const pos = getPos();
    if (typeof pos !== 'number') return;
    editor
      .chain()
      .focus()
      .setTextSelection(pos + 2)
      .unsetListening()
      .run();
  };

  return (
    <NodeViewWrapper as="section" data-listening="" className="my-5 border border-border bg-card">
      <div
        contentEditable={false}
        className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/40 px-2 py-1.5"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-3.5 w-3.5" weight="bold" />
        </span>
        <div className="flex overflow-hidden border border-border" role="group" aria-label="Kind">
          {LISTENING_MODES.map((option) => (
            <button
              key={option}
              type="button"
              onMouseDown={keepSelection}
              onClick={() => updateAttributes({ mode: option })}
              aria-pressed={option === mode}
              className={cn(
                'h-7 px-2.5 text-xs font-semibold transition-colors',
                option === mode
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-foreground hover:bg-accent',
              )}
            >
              {MODE_LABELS[option]}
            </button>
          ))}
        </div>
        <LanguagePicker value={lang} onChange={(code) => updateAttributes({ lang: code })} />
        <PreviewButtons segments={segments} lang={lang} audio={audio} />
        <button
          type="button"
          onMouseDown={keepSelection}
          onClick={() => updateAttributes({ transcript: isHidden ? 'shown' : 'hidden' })}
          aria-pressed={isHidden}
          title={
            isHidden ? 'Learners hear it first and reveal the text to check' : 'Learners see the text while it plays'
          }
          className={cn(
            CONTROL_CLASS,
            'gap-1 border border-border px-2',
            isHidden ? 'bg-primary/10 text-primary' : 'bg-background text-muted-foreground hover:bg-accent',
          )}
        >
          {isHidden ? <EyeSlashIcon className="h-3.5 w-3.5" /> : <EyeIcon className="h-3.5 w-3.5" />}
          {isHidden ? 'Text hidden' : 'Text shown'}
        </button>
        <button
          type="button"
          onMouseDown={keepSelection}
          onClick={unwrap}
          title="Turn back into plain paragraphs"
          aria-label="Turn back into plain paragraphs"
          className={cn(CONTROL_CLASS, 'ml-auto w-7 text-muted-foreground hover:bg-accent hover:text-foreground')}
        >
          <TextTIcon className="h-4 w-4" />
        </button>
      </div>
      {isDialogue ? (
        <p contentEditable={false} className="px-4 pt-2 text-xxs text-muted-foreground">
          One line per paragraph. Start each with the speaker in bold, e.g. <strong>Ana:</strong> Hola.
        </p>
      ) : null}
      <NodeViewContent className="px-4 [&_p]:my-2" />
    </NodeViewWrapper>
  );
};
