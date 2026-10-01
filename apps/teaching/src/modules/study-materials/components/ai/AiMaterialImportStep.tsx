import { RichTextView } from '@repo/ui/content';
import { type ILinkCheck } from '@repo/shared/contracts';
import { type IAiResource } from '@repo/shared/interfaces';
import { AiIssueList } from '@components/app/ai';
import {
  ArrowsClockwiseIcon,
  CaretDownIcon,
  CheckCircleIcon,
  FilePdfIcon,
  LinkSimpleIcon,
  UploadSimpleIcon,
  XCircleIcon,
  YoutubeLogoIcon,
} from '@phosphor-icons/react';
import { Button, Collapse, DrawerSection, TextArea } from '@repo/ui/app';
import { Badge, Spinner } from '@repo/ui/core';
import { cn } from '@repo/ui/lib';
import { LevelType } from '@enums';
import { type IAiIssue } from '@utils/ai/common';
import { type IImportedMaterial } from '@utils/ai/study-material-generator';
import { useRef, useState } from 'react';

export type LinkCheckState = 'idle' | 'checking' | 'done' | 'failed';

interface IProps {
  text: string;
  onChangeText: (text: string) => void;
  issues: IAiIssue[];
  imported: IImportedMaterial[];
  linkChecks: Map<string, ILinkCheck>;
  linkCheckState: LinkCheckState;
  onRecheckLinks: () => void;
  chapterName: (chapterId?: string) => string;
}

const LEVEL_TONE: Record<LevelType, 'success' | 'warning' | 'destructive'> = {
  [LevelType.EASY]: 'success',
  [LevelType.MEDIUM]: 'warning',
  [LevelType.HARD]: 'destructive',
};

const ResourceIcon = ({ resource }: { resource: IAiResource }) => {
  if (resource.kind === 'video') return <YoutubeLogoIcon weight="fill" className="h-3.5 w-3.5 text-destructive" />;
  if (resource.kind === 'pdf') return <FilePdfIcon weight="fill" className="h-3.5 w-3.5 text-destructive" />;
  return <LinkSimpleIcon weight="bold" className="h-3.5 w-3.5 rotate-45" />;
};

const CheckMark = ({ check }: { check?: ILinkCheck }) => {
  if (!check) return <span className="text-muted-foreground">not checked</span>;
  if (check.ok) return <CheckCircleIcon weight="fill" className="h-3.5 w-3.5 text-success" />;
  return (
    <span className="inline-flex items-center gap-1 text-destructive no-underline">
      <XCircleIcon weight="fill" className="h-3.5 w-3.5" />
      {check.status ?? 'unreachable'}
    </span>
  );
};

const ResourceRow = ({
  resource,
  check,
  isDropped,
}: {
  resource: IAiResource;
  check?: ILinkCheck;
  isDropped: boolean;
}) => (
  <li className={cn('flex items-center gap-2 text-xs', isDropped && 'text-muted-foreground line-through')}>
    <span className="shrink-0 text-muted-foreground">
      <ResourceIcon resource={resource} />
    </span>
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('min-w-0 truncate', isDropped ? '' : 'text-foreground hover:text-primary')}
      title={resource.url}
    >
      {resource.title || resource.url}
    </a>
    {resource.source ? <span className="shrink-0 text-muted-foreground">· {resource.source}</span> : null}
    <span className="ml-auto shrink-0">
      <CheckMark check={check} />
    </span>
  </li>
);

export const PreviewMaterial = ({
  item,
  number,
  linkChecks,
  chapterName,
}: {
  item: IImportedMaterial;
  number: number;
  linkChecks: Map<string, ILinkCheck>;
  chapterName: (chapterId?: string) => string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { material } = item;
  const all = [...item.resources, ...item.dropped];
  return (
    <article className="rounded-lg border border-border bg-background">
      <div className="flex flex-col gap-1.5 px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xxs font-semibold uppercase tracking-caps text-primary">
            {material.kind === 'examPrep' ? 'Exam prep' : `Lesson ${number}`}
          </span>
          {Object.values(LevelType).includes(material.level) ? (
            <Badge tone={LEVEL_TONE[material.level]} appearance="soft" className="px-1.5 py-0 text-xxs capitalize">
              {material.level}
            </Badge>
          ) : null}
          <span className="text-xxs text-muted-foreground">· {item.dto.durationMins} min</span>
          {material.tag ? <span className="font-mono text-xxs text-muted-foreground">#{material.tag}</span> : null}
          {material.chapter ? (
            <span className="text-xxs text-muted-foreground">· {chapterName(material.chapter)}</span>
          ) : null}
          <span className="ml-auto font-mono text-xxs text-muted-foreground">{material.ref}</span>
        </div>
        <h3 className="text-sm font-semibold text-foreground">{material.name}</h3>
        {material.topics?.length ? (
          <p className="text-xs text-muted-foreground">{material.topics.join(' · ')}</p>
        ) : null}
        {material.keyTerms?.length ? (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{material.keyTerms.length} key terms:</span>{' '}
            {material.keyTerms
              .slice(0, 8)
              .map((term) => term.term)
              .join(', ')}
            {material.keyTerms.length > 8 ? ', …' : ''}
          </p>
        ) : null}
        {all.length ? (
          <ul className="mt-1 flex flex-col gap-1 rounded-md bg-muted/40 px-2.5 py-2">
            {all.map((resource, index) => (
              <ResourceRow
                key={`${resource.url}-${index}`}
                resource={resource}
                check={linkChecks.get(resource.url)}
                isDropped={item.dropped.includes(resource)}
              />
            ))}
          </ul>
        ) : null}
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="mt-1 inline-flex items-center gap-1 self-start text-xs font-medium text-primary hover:underline"
          aria-expanded={isOpen}
        >
          <CaretDownIcon weight="bold" className={cn('h-3 w-3 transition-transform', isOpen && 'rotate-180')} />
          {isOpen ? 'Hide content' : 'Show content'}
        </button>
      </div>
      <Collapse isOpen={isOpen}>
        <div className="border-t border-border px-4 py-3">
          <RichTextView value={item.dto.content} className="text-sm leading-6" />
        </div>
      </Collapse>
    </article>
  );
};

export const LinkSummary = ({
  imported,
  linkChecks,
  state,
  onRecheck,
}: {
  imported: IImportedMaterial[];
  linkChecks: Map<string, ILinkCheck>;
  state: LinkCheckState;
  onRecheck: () => void;
}) => {
  const total = imported.reduce((sum, item) => sum + item.resources.length + item.dropped.length, 0);
  if (!total) return null;
  const dropped = imported.reduce((sum, item) => sum + item.dropped.length, 0);
  const checked = [...linkChecks.values()].length;
  const renderStatus = () => {
    if (state === 'checking') {
      return (
        <>
          <Spinner size="sm" />
          <span className="text-muted-foreground">Checking {total} references…</span>
        </>
      );
    }
    if (state === 'failed') {
      return <span className="text-foreground">The references could not be checked; all {total} will be kept.</span>;
    }
    return (
      <>
        <CheckCircleIcon weight="fill" className="h-4 w-4 text-success" />
        <span className="text-foreground">
          {checked ? `${total - dropped} of ${total} references reachable` : `${total} references`}
          {dropped ? <span className="text-muted-foreground"> · {dropped} unreachable, left out</span> : null}
        </span>
      </>
    );
  };
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs">
      {renderStatus()}
      <Button
        isSubtle
        className="ml-auto px-2 py-1 text-xs"
        text="Check again"
        leftsection={<ArrowsClockwiseIcon weight="bold" className="h-3.5 w-3.5" />}
        onClick={onRecheck}
        disabled={state === 'checking'}
      />
    </div>
  );
};

/** Step three: paste the reply, see what is wrong, watch the references get checked, preview the lessons. */
export const AiMaterialImportStep = ({
  text,
  onChangeText,
  issues,
  imported,
  linkChecks,
  linkCheckState,
  onRecheckLinks,
  chapterName,
}: IProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const errors = issues.filter((issue) => issue.level === 'error');
  const warnings = issues.filter((issue) => issue.level === 'warning');

  const readFile = (file: File | undefined) => {
    if (!file) return;
    file.text().then(onChangeText);
  };

  return (
    <div className="flex flex-col gap-6">
      <DrawerSection
        title="The model's reply"
        isRequired
        hint="Paste the JSON, or upload the .json file. It is checked as you go."
        action={
          <>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json,.txt"
              className="hidden"
              onChange={(event) => readFile(event.target.files?.[0])}
            />
            <Button
              isSecondary
              text="Upload file"
              leftsection={<UploadSimpleIcon weight="bold" className="h-4 w-4" />}
              onClick={() => fileRef.current?.click()}
            />
          </>
        }
      >
        <TextArea
          value={text}
          onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => onChangeText(event.target.value)}
          rows={8}
          className="font-mono text-xs leading-5"
          placeholder='{ "format": "acadimic.study-material/v1", ... }'
          aria-label="Generated JSON"
        />
      </DrawerSection>

      {text.trim() ? (
        <DrawerSection
          title={errors.length ? 'Fix these before importing' : 'Ready to import'}
          hint={
            errors.length
              ? `${errors.length} ${errors.length === 1 ? 'problem' : 'problems'}${warnings.length ? ` and ${warnings.length} ${warnings.length === 1 ? 'warning' : 'warnings'}` : ''}. Paste them back to the model and ask for corrected JSON.`
              : `${imported.length} ${imported.length === 1 ? 'lesson' : 'lessons'}${warnings.length ? `, ${warnings.length} ${warnings.length === 1 ? 'warning' : 'warnings'} worth a look` : ''}.`
          }
        >
          {issues.length ? (
            <AiIssueList issues={issues} />
          ) : (
            <p className="inline-flex items-center gap-1.5 text-xs text-success">
              <CheckCircleIcon weight="fill" className="h-4 w-4" />
              Everything checks out.
            </p>
          )}
        </DrawerSection>
      ) : null}

      {imported.length && !errors.length ? (
        <DrawerSection title="Preview" hint="What the import will add, in the order it will appear on the page.">
          <div className="flex flex-col gap-3">
            <LinkSummary
              imported={imported}
              linkChecks={linkChecks}
              state={linkCheckState}
              onRecheck={onRecheckLinks}
            />
            {imported.map((item, index) => (
              <PreviewMaterial
                key={item.material.ref || index}
                item={item}
                number={index + 1}
                linkChecks={linkChecks}
                chapterName={chapterName}
              />
            ))}
          </div>
        </DrawerSection>
      ) : null}
    </div>
  );
};
