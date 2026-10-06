import { FilePdfIcon, PaperPlaneRightIcon, PaperclipIcon, XIcon } from '@phosphor-icons/react';
import { DISCUSSION_FILE_EXTENSIONS, DISCUSSION_LIMITS, getFileExtension } from '@repo/shared/utils';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { cn } from '../../lib/cn';
import { Button } from '../buttons/Buttons';
import { TextArea } from '../inputs/TextArea';

const { MAX_ATTACHMENTS, MAX_ATTACHMENT_BYTES, MAX_BODY_LENGTH } = DISCUSSION_LIMITS;

interface IProps {
  placeholder: string;
  submitLabel: string;
  rows: number;
  isAutoFocus: boolean;
  /** Uploads the files and saves the comment; resolves to whether it was saved, which clears the box. */
  onSubmit: (body: string, files: File[]) => Promise<boolean>;
  /** Shows a Cancel button; a reply box has one, the main composer does not. */
  onCancel: (() => void) | null;
  /** Wraps the paperclip in the app's file picker, which calls `onPick` with what was chosen. */
  renderFilePicker: (trigger: ReactNode, onPick: (files: File[]) => void) => ReactNode;
}

/** Why a picked file cannot be attached, or null when it can. */
const getFileProblem = (file: File): string | null => {
  if (!DISCUSSION_FILE_EXTENSIONS.includes(getFileExtension(file.name))) return `${file.name} is not an image or PDF`;
  if (file.size > MAX_ATTACHMENT_BYTES) return `${file.name} is larger than 10 MB`;
  return null;
};

/** A staged file: a thumbnail for an image, a chip for a PDF, each with a remove button. */
const StagedFile = ({ file, onRemove }: { file: File; onRemove: () => void }) => {
  const previewUrl = useMemo(() => (file.type.startsWith('image/') ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => (previewUrl ? URL.revokeObjectURL(previewUrl) : undefined), [previewUrl]);
  return (
    <div className="relative">
      {previewUrl ? (
        <img src={previewUrl} alt={file.name} className="h-14 w-14 rounded-lg border border-border object-cover" />
      ) : (
        <div className="flex h-14 w-28 items-center gap-1.5 rounded-lg border border-border bg-muted/60 px-2">
          <FilePdfIcon weight="fill" className="h-5 w-5 shrink-0 text-destructive" />
          <span className="line-clamp-2 break-all text-xxs font-medium">{file.name}</span>
        </div>
      )}
      <button
        type="button"
        aria-label={`Remove ${file.name}`}
        onClick={onRemove}
        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm hover:text-destructive"
      >
        <XIcon weight="bold" className="h-3 w-3" />
      </button>
    </div>
  );
};

/**
 * Writes a comment or a reply, with up to five images or PDFs staged locally until it is posted,
 * so an abandoned draft uploads nothing. Cmd/Ctrl+Enter posts.
 */
export const CommentComposer = ({
  placeholder,
  submitLabel,
  rows,
  isAutoFocus,
  onSubmit,
  onCancel,
  renderFilePicker,
}: IProps) => {
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [problem, setProblem] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const canPost = Boolean(body.trim() || files.length) && !isPosting;
  const isFull = files.length >= MAX_ATTACHMENTS;

  const addFiles = (picked: File[]) => {
    const accepted = picked.filter((file) => !getFileProblem(file));
    const room = Math.max(MAX_ATTACHMENTS - files.length, 0);
    const problems = picked.map(getFileProblem).filter((message): message is string => Boolean(message));
    if (accepted.length > room) problems.push(`A comment can carry up to ${MAX_ATTACHMENTS} files`);
    setProblem(problems.length ? `${problems.join('. ')}.` : null);
    setFiles([...files, ...accepted.slice(0, room)]);
  };

  const post = async () => {
    if (!canPost) return;
    setIsPosting(true);
    const isSaved = await onSubmit(body.trim(), files).catch(() => false);
    setIsPosting(false);
    if (!isSaved) return;
    setBody('');
    setFiles([]);
    setProblem(null);
  };

  const trigger = (
    <Button
      isSubtle
      type="button"
      aria-label="Attach images or PDFs"
      className="rounded-full p-2 text-muted-foreground hover:text-foreground"
      leftsection={<PaperclipIcon weight="bold" className="h-4 w-4" />}
    />
  );

  return (
    <div className="flex flex-col gap-1">
      <div
        className={cn(
          'rounded-xl border border-border bg-background shadow-sm transition-colors focus-within:border-primary',
          isPosting && 'opacity-70',
        )}
      >
        <TextArea
          value={body}
          autoFocus={isAutoFocus}
          maxLength={MAX_BODY_LENGTH}
          placeholder={placeholder}
          rows={rows}
          disabled={isPosting}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) post();
          }}
          className="resize-none border-0 bg-transparent px-3 pt-2.5 shadow-none focus-visible:ring-0"
        />
        {files.length ? (
          <div className="flex flex-wrap gap-2 px-3 pb-2 pt-1">
            {files.map((file, index) => (
              <StagedFile
                key={`${file.name}-${file.lastModified}-${index}`}
                file={file}
                onRemove={() => setFiles(files.filter((_, at) => at !== index))}
              />
            ))}
          </div>
        ) : null}
        <div className="flex items-center gap-1 border-t border-border px-2 py-1.5">
          <div className={cn(isFull || isPosting ? 'pointer-events-none opacity-40' : '')}>
            {renderFilePicker(trigger, addFiles)}
          </div>
          <span className="text-xxs text-muted-foreground">
            {files.length ? `${files.length}/${MAX_ATTACHMENTS} files` : 'Images or PDF, up to 10 MB'}
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            {onCancel ? (
              <Button isSubtle className="px-3 py-1.5 text-xs" text="Cancel" onClick={onCancel} disabled={isPosting} />
            ) : null}
            <Button
              className="px-3 py-1.5 text-xs"
              text={submitLabel}
              disabled={!canPost}
              isLoading={isPosting}
              onClick={post}
              rightsection={isPosting ? null : <PaperPlaneRightIcon weight="fill" className="h-3.5 w-3.5" />}
            />
          </div>
        </div>
      </div>
      {problem ? <p className="px-1 text-xxs text-destructive">{problem}</p> : null}
    </div>
  );
};
