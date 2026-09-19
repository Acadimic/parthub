import { RichTextView } from '@repo/ui/content';
import { CheckCircleIcon, UploadSimpleIcon } from '@phosphor-icons/react';
import { AiIssueList } from '@components/app/ai';
import { Button, DrawerSection, TextArea } from '@repo/ui/app';
import { Badge } from '@repo/ui/core';
import { LevelType } from '@enums';
import { type IAiIssue, type IImportedQuestion } from '@utils/ai/test-paper-generator';
import { useRef } from 'react';
import { AnswerChoices } from '../AnswerChoices';
import { getQuestionTypeMeta } from '../question-types';

interface IProps {
  text: string;
  onChangeText: (text: string) => void;
  issues: IAiIssue[];
  imported: IImportedQuestion[];
}

const LEVEL_TONE: Record<LevelType, 'success' | 'warning' | 'destructive'> = {
  [LevelType.EASY]: 'success',
  [LevelType.MEDIUM]: 'warning',
  [LevelType.HARD]: 'destructive',
};

const PreviewQuestion = ({ item, number }: { item: IImportedQuestion; number: number }) => {
  const meta = getQuestionTypeMeta(item.question.questionType);
  const TypeIcon = meta.icon;
  return (
    <article className="rounded-lg border border-border bg-background px-3 py-2.5">
      <div className="mb-1 flex flex-wrap items-center gap-1.5">
        <span className="text-xxs font-semibold uppercase tracking-caps text-primary">Q{number}</span>
        <Badge tone="neutral" appearance="soft" className="gap-1 px-1.5 py-0 text-xxs">
          <TypeIcon className="h-3 w-3" />
          {meta.label}
        </Badge>
        {Object.values(LevelType).includes(item.question.level) ? (
          <Badge tone={LEVEL_TONE[item.question.level]} appearance="soft" className="px-1.5 py-0 text-xxs capitalize">
            {item.question.level}
          </Badge>
        ) : null}
        {item.question.tag ? (
          <span className="font-mono text-xxs text-muted-foreground">#{item.question.tag}</span>
        ) : null}
        {item.question.estimatedMinutes ? (
          <span className="text-xxs text-muted-foreground">· {item.question.estimatedMinutes} min</span>
        ) : null}
        <span className="ml-auto font-mono text-xxs text-muted-foreground">{item.question.ref}</span>
      </div>
      <RichTextView value={item.dto.body} className="text-sm leading-6" />
      {meta.hasChoices ? (
        <AnswerChoices options={item.dto.options ?? []} isMultiple={meta.isMultiple} className="mt-2" />
      ) : (
        <div className="mt-2 rounded-md border border-success/50 bg-success/5 px-3 py-1.5 text-sm">
          <RichTextView value={item.dto.options?.[0]?.body} />
        </div>
      )}
    </article>
  );
};

/** Step three: paste or upload the reply, see what is wrong with it, and preview what will import. */
export const AiImportStep = ({ text, onChangeText, issues, imported }: IProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const errors = issues.filter((issue) => issue.level === 'error');
  const warnings = issues.filter((issue) => issue.level === 'warning');
  const bySection = imported.reduce<Map<string, IImportedQuestion[]>>((map, item) => {
    const list = map.get(item.section.ref) ?? [];
    list.push(item);
    map.set(item.section.ref, list);
    return map;
  }, new Map());

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
          placeholder='{ "format": "acadimic.test-paper/v1", ... }'
          aria-label="Generated JSON"
        />
      </DrawerSection>

      {text.trim() ? (
        <DrawerSection
          title={errors.length ? 'Fix these before importing' : 'Ready to import'}
          hint={
            errors.length
              ? `${errors.length} ${errors.length === 1 ? 'problem' : 'problems'}${warnings.length ? ` and ${warnings.length} ${warnings.length === 1 ? 'warning' : 'warnings'}` : ''}. Paste them back to the model and ask for corrected JSON.`
              : `${imported.length} ${imported.length === 1 ? 'question' : 'questions'} across ${bySection.size} ${bySection.size === 1 ? 'section' : 'sections'}${warnings.length ? `, ${warnings.length} ${warnings.length === 1 ? 'warning' : 'warnings'} worth a look` : ''}.`
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
        <DrawerSection title="Preview" hint="What the import will add, as it will look in the paper.">
          <div className="flex flex-col gap-4">
            {[...bySection.entries()].map(([ref, items]) => (
              <div key={ref} className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-foreground">
                  {items[0].section.name}
                  <span className="ml-1.5 font-mono text-xxs text-muted-foreground">
                    {items[0].section.sectionId ? 'existing section' : 'new section'} · {items.length}
                  </span>
                </p>
                {items.map((item, index) => (
                  <PreviewQuestion key={item.question.ref || index} item={item} number={index + 1} />
                ))}
              </div>
            ))}
          </div>
        </DrawerSection>
      ) : null}
    </div>
  );
};
