import { Select } from '@components/app/selects';
import { PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { Button, DrawerSection, TextArea, TextInput } from '@repo/ui/app';
import { Checkbox } from '@repo/ui/core';
import { cn } from '@repo/ui/lib';
import { LevelType } from '@enums';
import { type ISelectItem } from '@interfaces';
import {
  EXAM_STYLES,
  type IAiBlueprint,
  type IAiSectionPlan,
  type IDifficultyMix,
  LANGUAGES,
  totalCount,
} from '@utils/ai/test-paper-generator';
import { QUESTION_TYPE_ORDER, QUESTION_TYPES } from '../question-types';

/** A section plan plus whether the teacher wants it in this run. */
export interface IPlanRow extends IAiSectionPlan {
  isEnabled: boolean;
}

interface IProps {
  blueprint: IAiBlueprint;
  rows: IPlanRow[];
  chapterItems: ISelectItem[];
  onChangeBlueprint: (fields: Partial<IAiBlueprint>) => void;
  onChangeRow: (key: string, fields: Partial<IPlanRow>) => void;
  onAddRow: () => void;
  onRemoveRow: (key: string) => void;
}

const LEVEL_TONE: Record<LevelType, string> = {
  [LevelType.EASY]: 'bg-success',
  [LevelType.MEDIUM]: 'bg-warning',
  [LevelType.HARD]: 'bg-destructive',
};

const toNumber = (value: string) => Math.max(0, Math.floor(Number(value) || 0));

/** How many of each type a section gets: six small inputs, labelled by the type's short name. */
const CountsGrid = ({ row, onChange }: { row: IPlanRow; onChange: (fields: Partial<IPlanRow>) => void }) => (
  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
    {QUESTION_TYPE_ORDER.map((type) => {
      const meta = QUESTION_TYPES[type];
      const Icon = meta.icon;
      return (
        <label key={type} className="flex flex-col gap-1">
          <span
            className="inline-flex items-center gap-1 truncate text-xxs font-semibold text-muted-foreground"
            title={meta.label}
          >
            <Icon className="h-3 w-3 shrink-0" />
            {meta.label}
          </span>
          <TextInput
            type="number"
            min={0}
            className="h-8 px-2 text-right font-mono"
            value={row.counts[type] || ''}
            placeholder="0"
            disabled={!row.isEnabled}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              onChange({ counts: { ...row.counts, [type]: toNumber(event.target.value) } })
            }
            aria-label={`${row.name}: ${meta.label} questions`}
          />
        </label>
      );
    })}
  </div>
);

const SectionRow = ({
  row,
  chapterItems,
  onChange,
  onRemove,
}: {
  row: IPlanRow;
  chapterItems: ISelectItem[];
  onChange: (fields: Partial<IPlanRow>) => void;
  onRemove?: () => void;
}) => (
  <div
    className={cn(
      'flex flex-col gap-3 rounded-lg border p-3 transition-colors',
      row.isEnabled ? 'border-primary/40 bg-primary/5' : 'border-border',
    )}
  >
    <div className="flex flex-wrap items-center gap-3">
      <Checkbox id={`plan-${row.key}`} checked={row.isEnabled} onChange={(isEnabled) => onChange({ isEnabled })} />
      {row.sectionId ? (
        <label
          htmlFor={`plan-${row.key}`}
          className="min-w-0 flex-1 cursor-pointer truncate text-sm font-semibold text-foreground"
        >
          {row.name}
        </label>
      ) : (
        <div className="min-w-0 flex-1">
          <TextInput
            value={row.name}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChange({ name: event.target.value })}
            placeholder="New section name"
            disabled={!row.isEnabled}
            aria-label="New section name"
          />
        </div>
      )}
      <span className="font-mono text-xs text-muted-foreground">{totalCount(row.counts)} questions</span>
      {onRemove ? (
        <Button isSubtle className="px-2 py-1" title="Remove this new section" onClick={onRemove}>
          <TrashIcon weight="bold" className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
    {row.isEnabled ? (
      <>
        <CountsGrid row={row} onChange={onChange} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Chapters"
            placeholder="Any chapter"
            items={chapterItems}
            values={row.chapterIds}
            onChange={(items) => onChange({ chapterIds: items.map((item) => item.value) })}
            isGrouped
          />
          <TextInput
            label="Focus"
            value={row.topics}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChange({ topics: event.target.value })}
            placeholder="Topics to concentrate on, if any"
          />
        </div>
      </>
    ) : null}
  </div>
);

/** Three shares that must sum to 100, with a bar that shows the mix as it is typed. */
const DifficultyMix = ({ value, onChange }: { value: IDifficultyMix; onChange: (mix: IDifficultyMix) => void }) => {
  const sum = value.easy + value.medium + value.hard;
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-3">
        {(Object.values(LevelType) as LevelType[]).map((level) => (
          <label key={level} className="flex flex-col gap-1">
            <span className="text-xs font-semibold capitalize text-foreground">{level}</span>
            <TextInput
              type="number"
              min={0}
              max={100}
              className="text-right font-mono"
              value={value[level]}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                onChange({ ...value, [level]: Math.min(100, toNumber(event.target.value)) })
              }
              rightsection={<span className="text-xs text-muted-foreground">%</span>}
              aria-label={`${level} share`}
            />
          </label>
        ))}
      </div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
        {(Object.values(LevelType) as LevelType[]).map((level) => (
          <span
            key={level}
            className={cn('h-full transition-all', LEVEL_TONE[level])}
            style={{ width: `${sum ? (value[level] / sum) * 100 : 0}%` }}
          />
        ))}
      </div>
      {sum !== 100 ? (
        <p className="text-xs text-destructive">The shares add up to {sum}%; they should make 100%.</p>
      ) : null}
    </div>
  );
};

/** Step one: what to generate, section by section, and the rules that apply to the whole paper. */
export const AiBlueprintStep = ({
  blueprint,
  rows,
  chapterItems,
  onChangeBlueprint,
  onChangeRow,
  onAddRow,
  onRemoveRow,
}: IProps) => (
  <div className="flex flex-col gap-6">
    <DrawerSection
      title="Sections"
      isRequired
      hint="Tick the sections to fill and say how many questions of each type. Add a section to have the import create one."
      action={
        <Button
          isSubtle
          className="px-2 py-1 text-xs"
          text="Add section"
          leftsection={<PlusIcon weight="bold" className="h-3.5 w-3.5" />}
          onClick={onAddRow}
        />
      }
    >
      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <SectionRow
            key={row.key}
            row={row}
            chapterItems={chapterItems}
            onChange={(fields) => onChangeRow(row.key, fields)}
            onRemove={row.sectionId ? undefined : () => onRemoveRow(row.key)}
          />
        ))}
      </div>
    </DrawerSection>

    <DrawerSection title="Difficulty" hint="How the questions split between easy, medium and hard.">
      <DifficultyMix value={blueprint.difficulty} onChange={(difficulty) => onChangeBlueprint({ difficulty })} />
    </DrawerSection>

    <DrawerSection
      title="Style"
      hint="The examination the questions should feel like, and the language they are written in."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Exam style"
          items={EXAM_STYLES.map((style) => ({ label: style, value: style }))}
          values={[blueprint.examStyle]}
          onChange={(items) => items[0] && onChangeBlueprint({ examStyle: items[0].value })}
          isSingleSelect
          noSort
        />
        <Select
          label="Language"
          items={LANGUAGES.map((language) => ({ label: language, value: language }))}
          values={[blueprint.language]}
          onChange={(items) => items[0] && onChangeBlueprint({ language: items[0].value })}
          isSingleSelect
          noSort
        />
      </div>
      <Checkbox
        id="ai-include-solutions"
        label="Ask for a worked solution with every question"
        checked={blueprint.includeSolutions}
        onChange={(includeSolutions) => onChangeBlueprint({ includeSolutions })}
      />
    </DrawerSection>

    <DrawerSection
      title="Anything else"
      hint="Free text the model should follow: syllabus notes, question style, things to avoid."
    >
      <TextArea
        value={blueprint.instructions}
        onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
          onChangeBlueprint({ instructions: event.target.value })
        }
        placeholder="e.g. Follow the NCERT Class 11 syllabus. At least three questions should use graphs described in words."
      />
    </DrawerSection>
  </div>
);
