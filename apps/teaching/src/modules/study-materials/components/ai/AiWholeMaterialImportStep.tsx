import { type ILinkCheck } from '@repo/shared/contracts';
import { AiIssueList } from '@components/app/ai';
import {
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
  UploadSimpleIcon,
  WarningCircleIcon,
  XCircleIcon,
} from '@phosphor-icons/react';
import { Button, DrawerSection, TextArea } from '@repo/ui/app';
import { Badge } from '@repo/ui/core';
import { cn } from '@repo/ui/lib';
import { type IAiIssue } from '@utils/ai/common';
import { type IImportedMaterial } from '@utils/ai/study-material-generator';
import { useRef, useState } from 'react';
import { type LinkCheckState, LinkSummary, PreviewMaterial } from './AiMaterialImportStep';

/** One reply the teacher added, as the drawer keeps it. */
export interface IAiReply {
  key: string;
  /** The file's name, or "Pasted reply N". */
  label: string;
  text: string;
  /** Which subject it turned out to be for; absent while it does not parse. */
  pairTitle?: string;
  lessonCount: number;
  part?: { index: number; total: number };
  issues: IAiIssue[];
}

/** One standard-and-subject's merged replies, ready to preview. */
export interface IAiImportSet {
  key: string;
  title: string;
  outline: string[];
  issues: IAiIssue[];
  imported: IImportedMaterial[];
  chapterName: (chapterId?: string) => string;
}

interface IProps {
  replies: IAiReply[];
  onAddReplies: (items: { label: string; text: string }[]) => void;
  onRemoveReply: (key: string) => void;
  sets: IAiImportSet[];
  linkChecks: Map<string, ILinkCheck>;
  linkCheckState: LinkCheckState;
  onRecheckLinks: () => void;
}

const ReplyMark = ({ errors, warnings }: { errors: number; warnings: number }) => {
  if (errors) return <XCircleIcon weight="fill" className="h-4 w-4 shrink-0 text-destructive" />;
  if (warnings) return <WarningCircleIcon weight="fill" className="h-4 w-4 shrink-0 text-warning" />;
  return <CheckCircleIcon weight="fill" className="h-4 w-4 shrink-0 text-success" />;
};

const ReplyRow = ({ reply, onRemove }: { reply: IAiReply; onRemove: () => void }) => {
  const errors = reply.issues.filter((issue) => issue.level === 'error');
  const warnings = reply.issues.length - errors.length;
  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
      <div className="flex items-center gap-2">
        <ReplyMark errors={errors.length} warnings={warnings} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-foreground">
            {reply.pairTitle ?? reply.label}
            {reply.part ? (
              <span className="ml-1.5 font-mono text-xxs text-muted-foreground">
                part {reply.part.index}/{reply.part.total}
              </span>
            ) : null}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {reply.pairTitle ? `${reply.label} · ` : ''}
            {reply.lessonCount
              ? `${reply.lessonCount} ${reply.lessonCount === 1 ? 'lesson' : 'lessons'}`
              : 'not readable'}
            {errors.length ? ` · ${errors.length} ${errors.length === 1 ? 'problem' : 'problems'}` : ''}
            {warnings ? ` · ${warnings} ${warnings === 1 ? 'warning' : 'warnings'}` : ''}
          </span>
        </span>
        <Button isSubtle className="px-1.5 py-1.5" title={`Remove ${reply.label}`} onClick={onRemove}>
          <TrashIcon weight="bold" className="h-4 w-4" />
        </Button>
      </div>
      {/* A reply with problems never reaches a set's preview, so its problems are explained here. */}
      {errors.length ? <AiIssueList issues={errors} /> : null}
    </li>
  );
};

const SetPreview = ({ set, linkChecks }: { set: IAiImportSet; linkChecks: Map<string, ILinkCheck> }) => {
  const errors = set.issues.filter((issue) => issue.level === 'error');
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border p-3',
        errors.length ? 'border-destructive/40' : 'border-border',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground">{set.title}</h3>
        <Badge tone={errors.length ? 'destructive' : 'success'} appearance="soft" className="px-1.5 py-0 text-xxs">
          {errors.length ? `${errors.length} to fix` : `${set.imported.length} lessons`}
        </Badge>
      </div>
      {set.outline.length ? (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Syllabus:</span> {set.outline.join(' · ')}
        </p>
      ) : null}
      {set.issues.length ? <AiIssueList issues={set.issues} /> : null}
      {!errors.length
        ? set.imported.map((item, index) => (
            <PreviewMaterial
              key={item.material.ref || index}
              item={item}
              number={index + 1}
              linkChecks={linkChecks}
              chapterName={set.chapterName}
            />
          ))
        : null}
    </div>
  );
};

/**
 * Step three of a whole standard: add every reply — one per subject, or several parts of one —
 * and see them grouped by subject, checked, and previewed before anything is written.
 */
export const AiWholeMaterialImportStep = ({
  replies,
  onAddReplies,
  onRemoveReply,
  sets,
  linkChecks,
  linkCheckState,
  onRecheckLinks,
}: IProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState('');
  const allImported = sets.flatMap((set) => set.imported);

  const readFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const items = await Promise.all([...list].map(async (file) => ({ label: file.name, text: await file.text() })));
    onAddReplies(items);
    if (fileRef.current) fileRef.current.value = '';
  };

  const addDraft = () => {
    if (!draft.trim()) return;
    onAddReplies([{ label: `Pasted reply ${replies.length + 1}`, text: draft }]);
    setDraft('');
  };

  return (
    <div className="flex flex-col gap-6">
      <DrawerSection
        title="The models' replies"
        isRequired
        hint="Upload the .json files, or paste a reply and add it. A subject's parts can be added one at a time."
        action={
          <>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="application/json,.json,.txt"
              className="hidden"
              onChange={(event) => readFiles(event.target.files)}
            />
            <Button
              isSecondary
              text="Upload files"
              leftsection={<UploadSimpleIcon weight="bold" className="h-4 w-4" />}
              onClick={() => fileRef.current?.click()}
            />
          </>
        }
      >
        <div className="flex flex-col gap-2">
          <TextArea
            value={draft}
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setDraft(event.target.value)}
            rows={5}
            className="font-mono text-xs leading-5"
            placeholder='{ "format": "acadimic.study-material/v1", ... }'
            aria-label="Pasted reply"
          />
          <div>
            <Button
              isSecondary
              text="Add reply"
              leftsection={<PlusIcon weight="bold" className="h-4 w-4" />}
              onClick={addDraft}
              disabled={!draft.trim()}
            />
          </div>
        </div>
        {replies.length ? (
          <ul className="mt-2 flex flex-col gap-1.5">
            {replies.map((reply) => (
              <ReplyRow key={reply.key} reply={reply} onRemove={() => onRemoveReply(reply.key)} />
            ))}
          </ul>
        ) : null}
      </DrawerSection>

      {sets.length ? (
        <DrawerSection
          title="Preview"
          hint="Grouped by subject, in the order each set will appear on its page. Unreachable references are left out."
        >
          <div className="flex flex-col gap-4">
            <LinkSummary
              imported={allImported}
              linkChecks={linkChecks}
              state={linkCheckState}
              onRecheck={onRecheckLinks}
            />
            {sets.map((set) => (
              <SetPreview key={set.key} set={set} linkChecks={linkChecks} />
            ))}
          </div>
        </DrawerSection>
      ) : null}
    </div>
  );
};
