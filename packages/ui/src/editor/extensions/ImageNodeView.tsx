import { TrashIcon } from '@phosphor-icons/react';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { IMAGE_WIDTHS } from '@repo/shared/utils';
import { RichTextImage } from '../../content/RichTextImage';
import { cn } from '../../lib/cn';

const WIDTH_LABELS: Record<string, string> = { small: 'Small', medium: 'Medium', full: 'Full width' };

const FIELD_CLASS =
  'h-7 w-full min-w-0 rounded border border-border bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary';

/**
 * The picture as the reader sees it, plus, while it is selected, the fields that describe it.
 * Alt text is asked for every time because a screen reader and the plain-text projection both
 * read it; the caption is what sighted readers see under the image.
 */
export const ImageNodeView = ({ node, updateAttributes, deleteNode, selected, editor }: NodeViewProps) => {
  const src = String(node.attrs.src ?? '');
  const alt = String(node.attrs.alt ?? '');
  const caption = String(node.attrs.caption ?? '');
  const width = String(node.attrs.width ?? 'full');
  const isEditable = editor.isEditable;

  return (
    <NodeViewWrapper
      data-image=""
      className={cn(
        'my-4 rounded',
        selected && isEditable ? 'ring-2 ring-primary/60 ring-offset-2 ring-offset-background' : '',
      )}
    >
      <div data-drag-handle="" contentEditable={false}>
        <RichTextImage src={src} alt={alt} caption={caption} width={width} className="my-0" />
      </div>
      {selected && isEditable ? (
        <div contentEditable={false} className="mt-2 flex flex-col gap-2 rounded border border-border bg-muted/40 p-2">
          <div className="flex flex-wrap items-center gap-2">
            <input
              aria-label="Alt text"
              placeholder="Alt text: what the image shows"
              value={alt}
              onChange={(event) => updateAttributes({ alt: event.target.value })}
              className={cn(FIELD_CLASS, 'flex-1')}
            />
            <div className="flex overflow-hidden rounded border border-border" role="group" aria-label="Image width">
              {IMAGE_WIDTHS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => updateAttributes({ width: option })}
                  className={cn(
                    'h-7 px-2 text-xs',
                    option === width
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-foreground hover:bg-accent',
                  )}
                >
                  {WIDTH_LABELS[option]}
                </button>
              ))}
            </div>
            <button
              type="button"
              aria-label="Remove image"
              title="Remove image"
              onClick={() => deleteNode()}
              className="flex h-7 w-7 items-center justify-center rounded text-destructive hover:bg-destructive/10"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
          <input
            aria-label="Caption"
            placeholder="Caption (optional)"
            value={caption}
            onChange={(event) => updateAttributes({ caption: event.target.value })}
            className={FIELD_CLASS}
          />
        </div>
      ) : null}
    </NodeViewWrapper>
  );
};
